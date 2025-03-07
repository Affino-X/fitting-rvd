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
        let price = priceText.includes("По запросу") ? "По запросу" : parseInt(priceText.replace(/\D/g, ""), 10);

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
        return typeof item.price === "number" ? sum + item.price * item.quantity : sum;
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
            const price = priceText.includes("По запросу") ? "По запросу" : parseInt(priceText.replace(/\D/g, ""), 10) || 0;
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







// Использование классов
const fetchService = new FetchService("https://rvdexpert.ru/wp-json/custom/v1/brands/");
new Trigger(fetchService);
