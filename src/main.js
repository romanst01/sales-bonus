/**
 * Функция для расчета выручки
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    
    // Расчет по формуле из ТЗ: sale_price × quantity × (1 - discount/100)
    const discountMultiplier = 1 - (discount / 100);
    return sale_price * quantity * discountMultiplier;
}

/**
 * Функция для расчета бонусов
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    
    // Расчет бонуса согласно ТЗ
    if (index === 0) return profit * 0.15; // Первое место - 15%
    if (index === 1 || index === 2) return profit * 0.10; // Второе и третье место - 10%
    if (index === total - 1) return 0; // Последнее место - 0%
    return profit * 0.05; // Все остальные - 5%
}

/**
 * Функция для анализа данных продаж
 */
function analyzeSalesData(data, options) {
    // Проверка входных данных
    if (!data || 
        !Array.isArray(data.sellers) || 
        data.sellers.length === 0 ||
        !Array.isArray(data.products) || 
        data.products.length === 0 ||
        !Array.isArray(data.purchase_records) || 
        data.purchase_records.length === 0) {
        throw new Error("Некорректные входные данные");
    }
    
    // Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options;
    if (!calculateRevenue || !calculateBonus) {
        throw new Error("Не переданы необходимые функции для расчетов");
    }

    // Подготовка промежуточных данных
    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // Индексация продавцов и товаров
    const sellerIndex = Object.fromEntries(
        sellerStats.map(stat => [stat.seller_id, stat])
    );
    
    const productIndex = Object.fromEntries(
        data.products.map(product => [product.sku, product])
    );

    // Расчет выручки и прибыли для каждого продавца - СОГЛАСНО ТЗ
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        // Увеличить количество продаж и общую сумму согласно ТЗ
        seller.sales_count += 1;
        seller.revenue += record.total_amount; // Ключевое исправление!

        // Расчет прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            // Расчет выручки и прибыли для товара
            const revenue = calculateRevenue(item, product);
            const cost = product.purchase_price * item.quantity;
            const itemProfit = revenue - cost;
            seller.profit += itemProfit;

            // Учет проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // Назначение премий и формирование топ-10 товаров
    const totalSellers = sellerStats.length;
    const report = sellerStats.map((seller, index) => {
        const bonus_amount = calculateBonus(index, totalSellers, seller);

        // Топ-10 товаров согласно ТЗ
        const top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        // Округление согласно ТЗ: +value.toFixed(2)
        return {
            seller_id: seller.seller_id,
            name: seller.name,
            revenue: +seller.revenue.toFixed(2),
            profit: +seller.profit.toFixed(2),
            sales_count: seller.sales_count,
            top_products: top_products,
            bonus: +bonus_amount.toFixed(2)
        };
    });

    return report;
}