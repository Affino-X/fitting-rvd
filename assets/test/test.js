class FetchService {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async fetchData(type) {
        try {
            const response = await fetch(`${this.baseURL}?type=${type}`);
            const data = await response.json();

            return Array.isArray(data) 
                ? data.map(item => ({
                    ...item,
                    teh_harakteristiki: item.teh_harakteristiki.replace(/<br\s*\/?>/gi, " ")  // Убираем <br />
                })) 
                : [];
        } catch (error) {
            console.error("Ошибка запроса:", error);
            return [];
        }
    }
}

class Component {
    constructor(tag, props = {}, children = []) {
        this.tag = tag;
        this.props = props;
        this.children = children;
    }

    render() {
        const element = document.createElement(this.tag);

        Object.entries(this.props).forEach(([key, value]) => {
            if (key.startsWith("on")) {
                element.addEventListener(key.substring(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        });

        this.children.forEach(child => {
            if (child instanceof Component) {
                element.appendChild(child.render());
            } else {
                element.appendChild(document.createTextNode(child));
            }
        });

        return element;
    }
}

class HTMLBuilder {
    constructor(data) {
        this.data = data;
    }


    

   build() {
        return new Component("div", { class: "fitting-row" }, [
            new Component("div", { class: "fitting-row__wrapper" }, [
                new Component("div", { class: "fitting-row__name" }, [this.data.title]),
                ...(this.data.teh_harakteristiki && this.data.teh_harakteristiki.trim() !== "" 
                ? [new Component("div", { class: "fitting-details-header" }, [
                    new Component("span", {}, ["Внутренний диаметр рукава, мм (Ду) "]),
                    new Component("b", {}, [
                        this.data.teh_harakteristiki.split('\r\n')[0].split(/:\s*/)[1]
                    ])
                ])] 
                : [new Component("div", { class: "fitting-details-header" })]),
                new Component("div", { class: "fitting-details hidden" }, [
                    new Component("h4", { class: "fitting-table__column m-5 tablet" }, ["Тех. характеристики"]),
                    ...this.data.teh_harakteristiki.split('\r\n').map(row => {
                        const [label, value] = row.split(/:\s*/);
                        return new Component("div", { class: "row" }, [
                            new Component("span", {}, [label + ":"]),
                            new Component("div", { class: "line" }),
                            new Component("b", {}, [value])
                        ]);
                    })
                ]),
                new Component("div", { class: "fitting-row__qty" }, [
                    new Component("button", { class: "qty-btn minus" }, ["-"]),
                    new Component("span", { class: "qty-value" }, ["1"]),
                    new Component("button", { class: "qty-btn plus" }, ["+"])
                ]),
                new Component("div", { class: "fitting-row__price" }, [this.data.price ? `${this.data.price} руб.` : "По запросу"]),
                new Component("div", { class: "fitting-row__action" }, [
                    new Component("div", { class: "fitting-row__select" }, [
                        new Component("input", { 
                            type: "checkbox", 
                        })
                        
                    ]),
                    ...(this.data.teh_harakteristiki && this.data.teh_harakteristiki.trim() !== ""
                    ? [new Component("button", { class: "details-btn" }, ["Подробнее"])]
                    : [])
                ])
            ])
        ]);
    }

    buildSelectedItems(json) {
        return json.items.map(item => new Component("div", { class: "fitting-row row-result", "data-id": item.id }, [
            new Component("div", { class: "fitting-row__wrapper" }, [
                new Component("div", { class: "fitting-row__name" }, [item.name]),
                new Component("div", { class: "fitting-details-header" }, [
                    new Component("span", {}, ["Внутренний диаметр рукава, мм (Ду) "]),
                    new Component("b", {}, [item.dy])
                ]),
                new Component("div", { class: "fitting-row__qty" }, [
                    new Component("button", { class: "qty-btn minus" }, ["-"]),
                    new Component("span", { class: "qty-value" }, [item.quantity.toString()]),
                    new Component("button", { class: "qty-btn plus" }, ["+"])
                ]),
                new Component("div", { class: "fitting-row__price" }, [
                    item.price === "По запросу" ? "По запросу" : `${item.price} руб.`
                ]),
                new Component("div", { class: "fitting-row__delete" }, [
                    new Component("button", { class: "delete-btn" }, ["Удалить"])
                ])
            ])
        ]));
    }
    
} 

class ProductLogic {
    constructor(cardElement) {
        this.card = cardElement;
        this.detailsBtn = this.card.querySelector(".details-btn");
        this.details = this.card.querySelector(".fitting-details");
        this.header = this.card.querySelector(".fitting-details-header");
        this.minusBtn = this.card.querySelector(".qty-btn.minus");
        this.plusBtn = this.card.querySelector(".qty-btn.plus");
        this.qtyValue = this.card.querySelector(".qty-value");
        this.checkbox = this.card.querySelector(".fitting-row__select input[type='checkbox']");
        this.priceElement = this.card.querySelector(".fitting-row__price");
        this.count = parseInt(this.qtyValue?.textContent || "1", 10); // Если qtyValue нет, берем "1"

        this.init();
        this.restoreCheckboxState(); // Восстанавливаем состояние чекбокса при загрузке
    }

    init() {
        if (this.detailsBtn) this.detailsBtn.addEventListener("click", () => this.toggleDetails());
        if (this.minusBtn) this.minusBtn.addEventListener("click", () => this.decrease());
        if (this.plusBtn) this.plusBtn.addEventListener("click", () => this.increase());
        if (this.checkbox) this.checkbox.addEventListener("change", () => this.updateSelection());
    }

    toggleDetails() {
        if (!this.details || !this.header || !this.detailsBtn) return;
        this.details.classList.toggle("hidden");
        this.header.classList.toggle("hidden");
        this.detailsBtn.classList.toggle("active");
    }

    decrease() {
        if (this.count > 1) {
            this.count--;
            this.updateValue();
        }
    }

    increase() {
        this.count++;
        this.updateValue();
    }

    updateValue() {
        if (this.qtyValue) {
            this.qtyValue.textContent = this.count;
            this.updateSelection();
        }
    }

    getItemData() {
        const name = this.card.querySelector(".fitting-row__name")?.textContent.trim() || "Без названия";
        const dyElement = this.card.querySelector(".fitting-details-header b");
        const dy = dyElement ? dyElement.textContent.trim() || "Не указано" : "Не указано";

        const priceText = this.priceElement?.textContent.trim() || "По запросу";
        let price = priceText.includes("По запросу") 
        ? "По запросу" 
        : parseFloat(priceText.replace(/[^\d,.]/g, "").replace(",", "."));


        return {
            id: this.card.dataset.id || "unknown",
            name,
            dy,
            quantity: this.count,
            price
        };
    }

    updateSelection() {
        if (!this.checkbox) return;

        const id = this.card.dataset.id;
        if (this.checkbox.checked) {
            selectedItems.set(id, this.getItemData());
        } else {
            selectedItems.delete(id);
        }

        this.saveCheckboxState(id, this.checkbox.checked);
        return getJSON();
    }

        // 🟢 Метод сохранения состояния чекбокса в sessionStorage
    saveCheckboxState(id, checked) {
        let savedState = JSON.parse(sessionStorage.getItem("checkboxStates")) || {};
        savedState[id] = checked;
        sessionStorage.setItem("checkboxStates", JSON.stringify(savedState));
    }

    // 🟢 Метод восстановления состояния чекбокса при загрузке
    restoreCheckboxState() {
        let savedState = JSON.parse(sessionStorage.getItem("checkboxStates")) || {};
        if (savedState[this.card.dataset.id] !== undefined) {
            this.checkbox.checked = savedState[this.card.dataset.id];
        }
    }

}

// Глобальный список выбранных товаров
const selectedItems = new Map();

function getJSON() {
    const itemsArray = Array.from(selectedItems.values());
    const totalItems = itemsArray.length;
    const totalPrice = itemsArray.reduce((sum, item) => {
        return typeof item.price === "number" 
            ? sum + parseFloat(item.price) * item.quantity 
            : sum;
    }, 0);

    return {
        items: itemsArray,
        summary: {
            total_items: totalItems,
            total_price: totalPrice
        }
    };
}


class CartManager {
    constructor() {
        this.selectedItems = selectedItems; // Используем глобальный Map
        this.init();
    }

    init() {
        document.querySelectorAll(".row-result").forEach(row => {
            const id = row.dataset.id
            const name = row.querySelector(".fitting-row__name")?.textContent.trim() || "Неизвестно";
            const priceText = row.querySelector(".fitting-row__price")?.textContent.trim() || "";
            const price = priceText.includes("По запросу") ? "По запросу" : parseFloat(priceText.replace(/\D/g, ""), 10) || 0;
            const qtyElement = row.querySelector(".qty-value");

            let quantity = parseInt(qtyElement?.textContent) || 1;

            // Проверяем, есть ли кнопки, прежде чем вешать обработчики событий
            row.querySelector(".plus")?.addEventListener("click", () => this.updateQuantity(id, qtyElement, 1));
            row.querySelector(".minus")?.addEventListener("click", () => this.updateQuantity(id, qtyElement, -1));           
            row.querySelector(".delete-btn")?.addEventListener("click", () => this.removeItem(row, id));
        });

        this.updateSummary();
    }

    

    updateQuantity(id, qtyElement, change) {
 
        console.log(selectedItems)
        if (this.selectedItems.has(id)) {
            let item = this.selectedItems.get(id);
            item.quantity = Math.max(1, (Number(item.quantity) || 1) + (Number(change) || 0));
    
            this.selectedItems.set(id, { ...item });
            qtyElement.textContent = item.quantity;
            this.updateSummary();
        } else {
            console.warn(`Элемент с id ${id} не найден в selectedItems`);
        }
    }
    
    
    
    
    

    removeItem(row, id) {
        // Приводим id к строке, так как data-id в HTML — строка
        id = String(id);
    
        // Находим чекбокс по data-id
        const checkbox = document.querySelector(`.fitting-row[data-id="${id}"] input[type='checkbox']`);
        if (checkbox) {
            checkbox.checked = false; // Снимаем чекбокс
        }
    
        // Удаляем элемент
        row.remove();
        this.selectedItems.delete(id);
        this.updateSummary();
    }
    
    

    updateSummary() {
        let uniqueItems = this.selectedItems.size;
        let totalQuantity = 0;
        let totalPrice = 0;
    
        if (uniqueItems === 0) {
            // Если нет элементов, устанавливаем пустые значения
            document.getElementById("selected-count").textContent = "0";
            document.getElementById("total-price").textContent = "0";
            return;
        }
    
        this.selectedItems.forEach(item => {
            totalQuantity += item.quantity;
            if (typeof item.price === "number") {
                totalPrice += item.price * item.quantity;
            }
        });
    
        document.getElementById("selected-count").textContent = 
            `${uniqueItems}`;
    
        let totalPriceElement = document.getElementById("total-price");
        let totalPriceWrapper = totalPriceElement.parentElement; // <strong>
        
        if (totalPrice) {
            totalPriceElement.textContent = totalPrice.toLocaleString();
            totalPriceWrapper.innerHTML = `<span id="total-price">${totalPrice.toLocaleString()}</span> руб.`;
        } else {
            totalPriceWrapper.innerHTML = `<span id="total-price">По запросу</span>`;
        }
            
    }
    
    
}

// Main
class Trigger {
    constructor(fetchService) {
        this.fetchService = fetchService;
        this.buttons = document.querySelectorAll(".filter-btn");
        this.selectedItemsButton = document.getElementById("showSelectedItems"); // Получаем кнопку
        this.init();
    }

    async handleButtonClick(button) {
        console.log("handleButtonClick triggered for:", button);
        const isActive = button.classList.contains("active");
        this.buttons.forEach(btn => {
            if (btn !== button) {
                btn.classList.remove("active");
            }
        });

        button.classList.add("active");
        const query = button.getAttribute("data-query");

        // Запрос данных
        const jsonData = await this.fetchService.fetchData(query);
        const fitList = document.getElementById("fittingsList");
        fitList.innerHTML = ""; // Очистка

        jsonData.forEach(data => {
            const builder = new HTMLBuilder(data);
            const componentTree = builder.build();
            fitList.appendChild(componentTree.render());
        });
        // Инициализация всех карточек товаров
        document.querySelectorAll(".fitting-row").forEach((card, index) => {
            card.dataset.id = query + '-' + (index + 1);
            new ProductLogic(card);
        });
    }

    async handleShowSelectedItems() {
        console.log("Show selected items button clicked");

        // Получаем JSON (можно заменить на актуальный источник данных)
        const jsonData = getJSON();


        const builder = new HTMLBuilder({});
        const selectedItems = builder.buildSelectedItems(jsonData);
        const fitList = document.getElementById("fitResult");
        fitList.innerHTML = ""; // Очистка перед вставкой
        selectedItems.forEach(component => fitList.appendChild(component.render()));
        new CartManager();
        
    }

    async init() {
        this.buttons.forEach(button => {
            button.addEventListener("click", () => this.handleButtonClick(button));
        });

        window.addEventListener("load", () => {
            sessionStorage.removeItem("checkboxStates");
        });

        document.getElementById("showSelectedItems").addEventListener("click", function () {
            const fittingResult = document.querySelector(".fitting-result");
            const fittingTable = document.querySelector(".fitting-table");
        
            fittingResult.classList.toggle("hidden");
            fittingTable.classList.toggle("hidden");
        
            // Переключение текста кнопки
            this.textContent = fittingResult.classList.contains("hidden") 
                ? "Показать выбранные товары" 
                : "Скрыть выбранные товары";
        });
        

        // Назначаем обработчик на кнопку "Show Result"
        if (this.selectedItemsButton) {
            this.selectedItemsButton.addEventListener("click", () => this.handleShowSelectedItems());
        }

        // Загружаем данные при старте
        const activeButton = document.querySelector(".filter-btn.active");
        if (activeButton) {
            console.log("Active button found:", activeButton);
            await this.handleButtonClick(activeButton);
        } else {
            console.log("No active button found at init.");
        }
    }
}

class FormsValidation {
    selectors = {
      form: '[data-js-form]',
      fieldErrors: '[data-js-form-field-errors]',
      input: 'input'
    }

    errorMessages = {
      valueMissing: () => 'Пожалуйста, заполните это поле',
      patternMismatch: ({ title }) => title || 'Данные не соответствуют формату',
      tooShort: ({ minLength }) => `Слишком короткое значение, минимум символов — ${minLength}`,
      tooLong: ({ maxLength }) => `Слишком длинное значение, ограничение символов — ${maxLength}`,
      phoneMismatch: () => 'Неверный формат телефона',
      emailMismatch: () => 'Введите правильный Email'
    }

    constructor() {
      this.bindEvents()
    }

    // Управление ошибками
    manageErrors(fieldControlElement, errorMessages) {
      const fieldErrorsElement = fieldControlElement.parentElement.querySelector(this.selectors.fieldErrors)

      fieldErrorsElement.innerHTML = errorMessages
        .map((message) => `<span class="field__error">${message}</span>`)
        .join('')
    }

    // Валидация поля
    validateField(fieldControlElement) {
      const errors = fieldControlElement.validity
      const errorMessages = []

      Object.entries(this.errorMessages).forEach(([errorType, getErrorMessage]) => {
        if (errors[errorType]) {
          errorMessages.push(getErrorMessage(fieldControlElement))
        }
      })

      // Специфичная валидация для телефона
      if (fieldControlElement.id === 'phone' && fieldControlElement.value) {
        const phonePattern = /^\+?\d{10,12}$/;
        if (!phonePattern.test(fieldControlElement.value)) {
          errorMessages.push(this.errorMessages.phoneMismatch())
        }
      }

      // Специфичная валидация для email
      if (fieldControlElement.id === 'email' && fieldControlElement.value) {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?!co$|tv$)[a-zA-Z]{2,}$/;
        if (!emailPattern.test(fieldControlElement.value)) {
          errorMessages.push(this.errorMessages.emailMismatch())
        }
      }

      this.manageErrors(fieldControlElement, errorMessages)

      const isValid = errorMessages.length === 0
      fieldControlElement.ariaInvalid = !isValid

      // Применение стилей для невалидных и валидных полей
      if (isValid) {
        fieldControlElement.style.borderColor = '#4CAF50'; // Зеленая рамка для валидных полей
        fieldControlElement.style.boxShadow = '0 0 5px rgba(76, 175, 80, 0.5)';
      } else {
        fieldControlElement.style.borderColor = 'rgba(231, 23, 0, 0.5)'; // Оранжевая рамка для невалидных полей
        fieldControlElement.style.boxShadow = '0 0 5px rgba(254, 28, 3, 0.5)';
      }

      return isValid
    }

    // Обработчик события "изменение поля"
    onInput(event) {
      const { target } = event
      const isFormField = target.closest(this.selectors.form)

      if (isFormField) {
        // Если поле изменено, проверяем валидацию
        this.validateField(target)
      }
    }

    // Обработчик события "отправка формы"
    onSubmit(event) {
        const isFormElement = event.target.matches(this.selectors.form);
        if (!isFormElement) return;
      
        const requiredControlElements = [...event.target.elements].filter(({ required }) => required);
        let isFormValid = true;
        let firstInvalidFieldControl = null;
      
        requiredControlElements.forEach((element) => {
          const isFieldValid = this.validateField(element);
      
          if (!isFieldValid) {
            isFormValid = false;
      
            if (!firstInvalidFieldControl) {
              firstInvalidFieldControl = element;
            }
          }
        });
      
        // Проверяем, выбраны ли элементы в Map
        const fieldErrorsElement = document.getElementById('selected-errors');
      
        if (selectedItems.size === 0) {
          isFormValid = false;
          if (fieldErrorsElement) {
            showToastError("Пожалуйста, выберите хотя бы одну строку.")
          }
        } else if (fieldErrorsElement) {
          fieldErrorsElement.innerHTML = ''; // Очищаем ошибку, если элемент выбран
        }
      
        if (!isFormValid) {
          event.preventDefault();
          if (firstInvalidFieldControl) firstInvalidFieldControl.focus();
        }
      }
      

    // Привязка событий
    bindEvents() {
      // Добавляем обработчик на изменение поля (для проверки после ввода)
      document.addEventListener('input', (event) => {
        this.onInput(event)
      })

      // Добавляем обработчик на отправку формы
      document.addEventListener('submit', (event) => this.onSubmit(event))
    }
}

function showToastError(message) {
    const toast = document.createElement("div");
    toast.classList.add("toast-error");

    // Добавляем иконку (SVG)
    toast.innerHTML = `
        <svg class="toast-icon" viewBox="0 0 24 24">
            <path fill="white" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}


  

  






// Использование классов
const fetchService = new FetchService("https://rvdexpert.ru/wp-json/custom/v1/brands/");
new Trigger(fetchService);
// Инициализация валидации
new FormsValidation()
