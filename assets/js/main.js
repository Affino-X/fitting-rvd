// // Click button and Call Ajax-request
// document.querySelectorAll(".filter-btn").forEach(button => {
//     button.addEventListener("click", () => {
//         // Проверяем, есть ли у кнопки класс active
//         const isActive = button.classList.contains("active");

//         // Убираем active у всех кнопок
//         document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));

//         if (!isActive) {
//             // Добавляем active к нажатой кнопке
//             button.classList.add("active");

//             // Получаем data-query и отправляем AJAX-запрос
//             const query = button.getAttribute("data-query");
//             fetchData(query);
//         }
//     });
// });

// // Fetch "JSON TABLE DATA"
// function fetchData(type) {
//     fetch(`https://rvdexpert.ru/wp-json/custom/v1/brands/?type=${type}`)
//         .then(response => response.json())
//         .then(data => {
//             const container = document.getElementById("fitTable");
//             container.innerHTML = ""; // Очищаем перед вставкой новых данных

//             if (!Array.isArray(data)) {
//                 container.textContent = "Ошибка: Ожидался массив данных";
//                 return;
//             }

//             container.innerHTML = data.map(item => `
//                 <div class="brand-item">
//                     <h3>${item.title}</h3>
//                     <p><strong>Характеристики:</strong> ${item.teh_harakteristiki}</p>
//                     <p><strong>Цена:</strong> ${item.price} ₽</p>
//                 </div>
//             `).join("");
//         })
//         .catch(error => {
//             console.error("Ошибка запроса:", error);
//             document.getElementById("fitContent").textContent = "Ошибка загрузки данных";
//         });
// }
// // Найти кнопку с классом active и выполнить запрос, если она есть
// const activeButton = document.querySelector(".filter-btn.active");
// if (activeButton) {
//     const query = activeButton.getAttribute("data-query");
//     fetchData(query);
// }

// Show More
document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".filter-btn");
    const showMoreBtn = document.getElementById("showMore");

    // Настройки для разных устройств
    const settings = {
        desktop: { show: 12, step: 6 },    // Для больших экранов
        tablet: { show: 8, step: 4 },     // Для планшетов
        mobile: { show: 4, step: 2 }      // Для мобильных
    };

    let showCount, step;

    function applySettings() {
        const width = window.innerWidth;

        if (width > 1150) {
            showCount = settings.desktop.show;
            step = settings.desktop.step;
        } else if (width > 768) {
            showCount = settings.tablet.show;
            step = settings.tablet.step;
        } else {
            showCount = settings.mobile.show;
            step = settings.mobile.step;
        }

        updateButtons();
    }

    function updateButtons() {
        buttons.forEach((btn, index) => {
            if (index < showCount) {
                btn.classList.add("visible");
            } else {
                btn.classList.remove("visible");
            }
        });

        // Скрываем кнопку, если все элементы уже показаны
        if (showCount >= buttons.length) {
            showMoreBtn.style.display = "none";
        } else {
            showMoreBtn.style.display = "block";
        }
    }

    showMoreBtn.addEventListener("click", () => {
        showCount += step;
        updateButtons();
    });

    // Применяем настройки при загрузке и изменении размера экрана
    applySettings();
    window.addEventListener("resize", applySettings);
});


// Show more table

document.querySelectorAll(".details-btn").forEach(button => {
    button.addEventListener("click", function () {
        const card = this.closest(".fitting-row"); // Находим родительскую карточку
        const details = card.querySelector(".fitting-details");
        const header = card.querySelector(".fitting-details-header");

        details.classList.toggle("hidden");
        header.classList.toggle("hidden");
        
        this.classList.toggle("active"); // Добавляем/удаляем класс "active" у текущей кнопки
    });
});


// Counter
document.querySelectorAll(".fitting-row__qty").forEach(qtyContainer => {
    const minusBtn = qtyContainer.querySelector(".qty-btn.minus");
    const plusBtn = qtyContainer.querySelector(".qty-btn.plus");
    const qtyValue = qtyContainer.querySelector(".qty-value");

    let count = parseInt(qtyValue.textContent, 10); // Начальное значение

    // Уменьшение количества
    minusBtn.addEventListener("click", function () {
        if (count > 1) { // Не даем уйти в отрицательное значение
            count--;
            qtyValue.textContent = count;
        }
    });

    // Увеличение количества
    plusBtn.addEventListener("click", function () {
        count++;
        qtyValue.textContent = count;
    });
});


function getCheckedItems() {
    const checkedItems = [];

    document.querySelectorAll(".fitting-row").forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
            const name = row.querySelector(".fitting-row__name")?.textContent.trim();
            const specs = row.querySelector(".fitting-details-header")?.textContent.trim();
            const qty = row.querySelector(".qty-value")?.textContent.trim();
            const price = row.querySelector(".fitting-row__price")?.textContent.trim();

            checkedItems.push({ name, specs, quantity: qty, price });
        }
    });

    return checkedItems;
}

// // Функция для вывода данных
// function displayCheckedItems() {
//     const selectedItems = getCheckedItems();
//     const outputContainer = document.querySelector("#selected-items");
//     outputContainer.innerHTML = ""; // Очищаем перед обновлением

//     if (selectedItems.length === 0) {
//         outputContainer.innerHTML = "<p>Нет выбранных товаров</p>";
//         return;
//     }

//     selectedItems.forEach(item => {
//         const row = document.createElement("div");
//         row.classList.add("selected-item");
//         row.innerHTML = `
//             <div class="selected-name">${item.name}</div>
//             <div class="selected-specs">${item.specs}</div>
//             <div class="selected-qty">${item.quantity}</div>
//             <div class="selected-price">${item.price}</div>
//         `;
//         outputContainer.appendChild(row);
//     });
// }

// // Обработчик для кнопки "Посчитать"
// document.querySelector(".calculate-btn").addEventListener("click", displayCheckedItems);
