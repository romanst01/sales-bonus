/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;
  const discountMultiplier = 1 - discount / 100;
  const revenue = sale_price * quantity * discountMultiplier;

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
  // @TODO: Расчет бонуса от позиции в рейтинге
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
  // @TODO: Проверка входных данных

  const { calculateRevenue, calculateBonus } = options;
  if (!calculateRevenue || !calculateBonus) {
    throw new Error("Отсутствуют необходимые функции для расчетов");
  }
  // @TODO: Проверка наличия опций

const SellerStats= data.sellers.map (seller => {
    return {
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }
})
  // @TODO: Подготовка промежуточных данных для сбора статистики

const sellerIndex = {};
    SellerStats.forEach(seller => {
        sellerIndex[seller.id] = seller;
    });
const productIndex = {};
    data.products.forEach(product =>{
        productIndex [product.sku]=product;
    })
  // @TODO: Индексация продавцов и товаров для быстрого доступа


  // @TODO: Расчет выручки и прибыли для каждого продавца
data.purchase_records.forEach(record => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;
    seller.sales_count += 1;

record.items.forEach(item => {
            const product = productIndex[item.sku];
            
            if (!product) return;
           
            const cost = product.purchase_price * item.quantity;
        
            const revenue = calculateRevenue(item, product);
            const profit = revenue - cost;
        
            seller.revenue += revenue;
            seller.profit += profit;
            
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });


  // @TODO: Сортировка продавцов по прибыли


  // @TODO: Назначение премий на основе ранжирования


  // @TODO: Подготовка итоговой коллекции с нужными полями.