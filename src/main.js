/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  const { sale_price, quantity } = purchase;
  const revenue = sale_price * quantity;
  return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;
  if (index === 0) {
    return profit * 0.15;
  } else if (index === 1 || index === 2) {
    return profit * 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    return profit * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    data.sellers.length === 0 ||
    !Array.isArray(data.products) ||
    data.products.length === 0 ||
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  const { calculateRevenue, calculateBonus } = options;
  if (!calculateRevenue || !calculateBonus) {
    throw new Error("Отсутствуют необходимые функции для расчетов");
  }

  const sellerStats = data.sellers.map((seller) => {
    return {
      id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
      revenue: 0,
      profit: 0,
      sales_count: 0,
      products_sold: {},
    };
  });

  const sellerIndex = {};
  sellerStats.forEach((seller) => {
    sellerIndex[seller.id] = seller;
  });

  const productIndex = {};
  data.products.forEach((product) => {
    productIndex[product.sku] = product;
  });

  // Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;

    seller.sales_count += 1;

    // 1. Считаем общую сумму всех товаров в чеке
    let totalItemsAmount = 0;
    const itemsData = [];

    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      if (!product) return;

      // Сумма товара БЕЗ скидки
      const itemAmount = item.sale_price * item.quantity;
      totalItemsAmount += itemAmount;

      itemsData.push({
        item,
        product,
        itemAmount,
      });
    });

    // 2. Распределяем общую скидку по чеку
    itemsData.forEach(({ item, product, itemAmount }) => {
      // Доля товара в чеке
      const itemShare = itemAmount / totalItemsAmount;

      // Часть общей скидки для этого товара
      const itemDiscount = record.total_discount * itemShare;

      // Выручка с учетом доли общей скидки
      const revenue = itemAmount - itemDiscount;

      const cost = product.purchase_price * item.quantity;
      const profit = revenue - cost;

      seller.revenue += revenue;
      seller.profit += profit;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // Назначение премий на основе ранжирования
  const sellerSort = sellerStats.length;
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerSort, seller);

    const productsArray = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    seller.top_products = productsArray;
  });

  // Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}
