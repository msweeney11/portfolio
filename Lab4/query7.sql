SELECT c.first_name, c.last_name, a.line1, a.city, a.state, a.zip_code
FROM customers c 
JOIN addresses a ON c.customer_id = a.customer_id
WHERE c.shipping_address_id = a.address_id
ORDER BY a.zip_code ASC;