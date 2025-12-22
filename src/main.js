/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
	const {discount, sale_price, quantity} = purchase;
	const discount_percent = 1 - (discount / 100);
	return sale_price * quantity * discount_percent;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {

	const {profit} = seller;
	if (index === 0)
		return profit * .15;
	else if (index === 1 || index === 2)
		return profit * .10;
	else if (index === total - 1)
		return 0;
	else
		return profit * .05;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
	// Проверка входных данных
	if (!data
		|| !Array.isArray(data.products)
		|| !Array.isArray(data.sellers)
		|| !Array.isArray(data.purchase_records)
		|| data.products.length === 0
		|| data.sellers.length === 0
		|| data.purchase_records.length === 0
	) {
		throw new Error('Некорректные входные данные');
	}

	// Проверка наличия опций
	const {calculateRevenue, calculateBonus} = options;
	if (!calculateRevenue
		|| !calculateBonus
		|| typeof calculateRevenue !== "function"
		|| typeof calculateBonus !== "function"
	) {
		throw new Error('Неверно определены функции для расчёта бонуса или/и выручки');
	}

	// Подготовка промежуточных данных для сбора статистики
	const sellerStats = data.sellers.map(seller => ({
		id: seller.id,
		name: `${seller.first_name} ${seller.last_name}`,
		revenue: 0,
		profit: 0,
		sales_count: 0,
		products_sold: {}
	}));

	// Индексация продавцов и товаров для быстрого доступа
	const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]));
	const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));

	// Расчет выручки и прибыли для каждого продавца
	data.purchase_records.forEach(record => {
		const seller = sellerIndex[record.seller_id];
		seller.sales_count++;
		seller.revenue += record.total_amount;

		record.items.forEach(item => {
			const product = productIndex[item.sku];
			const cost = product.purchase_price * item.quantity;
			const revenue = calculateRevenue(item, product);
			const profit = revenue - cost;
			seller.profit += profit;

			// Учёт количества проданных товаров
			if (!seller.products_sold[item.sku]) {
				seller.products_sold[item.sku] = 0;
			}
			seller.products_sold[item.sku]+= item.quantity;
		});
	});

	// Сортируем продавцов по убыванию от прибыли
	sellerStats.sort((a, b) => b.profit - a.profit);

	// Назначение премий на основе ранжирования
	sellerStats.forEach((seller, index) => {
		seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller);
		const productsStats = Object.entries(seller.products_sold).map((array) => {
				return {sku: array[0], quantity: array[1]}
			}
		);
		seller.top_products = productsStats.sort((a, b) => b.quantity - a.quantity).slice(0, 10);
	});

	// Подготовка итоговой коллекции с нужными полями
	return sellerStats.map(seller => ({
		seller_id: seller.id,
		name: seller.name,
		revenue: +seller.revenue.toFixed(2),
		profit: +seller.profit.toFixed(2),
		sales_count: seller.sales_count,
		top_products: seller.top_products,
		bonus: +seller.bonus.toFixed(2)
	}));
}