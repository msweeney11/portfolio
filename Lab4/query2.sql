SELECT first_name, last_name, CONCAT(last_name, ", ", first_name) AS full_name
FROM customers
WHERE last_name >= 'M'
ORDER BY last_name ASC;
