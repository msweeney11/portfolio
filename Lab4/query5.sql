SELECT c.category_name, p.product_name, p.list_price
FROM Products p
JOIN categories c ON p.category_id = c.category_id
ORDER BY c.category_name ASC, p.product_name ASC;