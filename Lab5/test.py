import unittest
import datetime
from unittest.mock import Mock
from decimal import Decimal
from main import get_products,get_customers, get_prices, get_discounts, get_products_join, get_customers_join, get_address

class TestQueries(unittest.TestCase):

    def test_get_products(self):
        mock_cursor = Mock()
        expected_data = [('sg', 'Gibson SG', Decimal('2517.00'), Decimal('52.00')),
                         ('les_paul', 'Gibson Les Paul', Decimal('1199.00'), Decimal('30.00')),
                         ('precision', 'Fender Precision', Decimal('799.99'), Decimal('30.00')),
                         ('tama', 'Tama 5-Piece Drum Set with Cymbals', Decimal('799.99'), Decimal('15.00')),
                         ('ludwig', 'Ludwig 5-piece Drum Set with Cymbals', Decimal('699.99'), Decimal('30.00')),
                         ('strat', 'Fender Stratocaster', Decimal('699.00'), Decimal('30.00')),
                         ('hofner', 'Hofner Icon', Decimal('499.99'), Decimal('25.00')),
                         ('fg700s', 'Yamaha FG700S', Decimal('489.99'), Decimal('38.00')),
                         ('rodriguez', 'Rodriguez Caballero 11', Decimal('415.00'), Decimal('39.00')),
                         ('washburn', 'Washburn D10S', Decimal('299.00'), Decimal('0.00'))]

        mock_cursor.fetchall.return_value = expected_data
        result = get_products(mock_cursor)
        self.assertEqual(result, expected_data)

    def test_get_customers(self):
      mock_cursor = Mock()
      expected_data = [('Allan', 'Sherwood', 'Sherwood, Allan'),
                       ('Erin', 'Valentino', 'Valentino, Erin'),
                       ('Frank Lee', 'Wilson', 'Wilson, Frank Lee'),
                       ('Barry', 'Zimmer', 'Zimmer, Barry')]

      mock_cursor.fetchall.return_value = expected_data
      result = get_customers(mock_cursor)
      self.assertEqual(result, expected_data)

    def test_get_prices(self):
      mock_cursor = Mock()
      expected_data = [('Tama 5-Piece Drum Set with Cymbals', Decimal('799.99'), datetime.datetime(2018, 7, 30, 13, 14, 15)),
                       ('Ludwig 5-piece Drum Set with Cymbals', Decimal('699.99'), datetime.datetime(2018, 7, 30, 12, 46, 40)),
                       ('Fender Precision', Decimal('799.99'), datetime.datetime(2018, 6, 1, 11, 29, 35)),
                       ('Gibson Les Paul', Decimal('1199.00'), datetime.datetime(2017, 12, 5, 16, 33, 13)),
                       ('Fender Stratocaster', Decimal('699.00'), datetime.datetime(2017, 10, 30, 9, 32, 40))]

      mock_cursor.fetchall.return_value = expected_data
      result = get_prices(mock_cursor)
      self.assertEqual(result, expected_data)

    def test_get_discounts(self):
      mock_cursor = Mock()
      expected_data = [(5, Decimal('1199.00'), Decimal('359.70'), 2, Decimal('2398.00'), Decimal('719.40'), Decimal('1678.60')),
                       (3, Decimal('2517.00'), Decimal('1308.84'), 1, Decimal('2517.00'), Decimal('1308.84'), Decimal('1208.16')),
                       (1, Decimal('1199.00'), Decimal('359.70'), 1, Decimal('1199.00'), Decimal('359.70'), Decimal('839.30')),
                       (11, Decimal('799.99'), Decimal('120.00'), 1, Decimal('799.99'), Decimal('120.00'), Decimal('679.99')),
                       (9, Decimal('799.99'), Decimal('240.00'), 1, Decimal('799.99'), Decimal('240.00'), Decimal('559.99'))]

      mock_cursor.fetchall.return_value = expected_data
      result = get_discounts(mock_cursor)
      self.assertEqual(result, expected_data)

    def test_get_products_join(self):
      mock_cursor = Mock()
      expected_data = [('Basses', 'Fender Precision', Decimal('799.99')),
                       ('Basses', 'Hofner Icon', Decimal('499.99')),
                       ('Drums', 'Ludwig 5-piece Drum Set with Cymbals', Decimal('699.99')),
                       ('Drums', 'Tama 5-Piece Drum Set with Cymbals', Decimal('799.99')),
                       ('Guitars', 'Fender Stratocaster', Decimal('699.00')),
                       ('Guitars', 'Gibson Les Paul', Decimal('1199.00')),
                       ('Guitars', 'Gibson SG', Decimal('2517.00')),
                       ('Guitars', 'Rodriguez Caballero 11', Decimal('415.00')),
                       ('Guitars', 'Washburn D10S', Decimal('299.00')),
                       ('Guitars', 'Yamaha FG700S', Decimal('489.99'))]

      mock_cursor.fetchall.return_value = expected_data
      result = get_products_join(mock_cursor)
      self.assertEqual(result, expected_data)

    def test_get_customers_join(self):
      mock_cursor = Mock()
      expected_data = [('Allan', 'Sherwood', '100 East Ridgewood Ave.', 'Paramus', 'NJ', '07652'),
                       ('Allan', 'Sherwood', '21 Rosewood Rd.', 'Woodcliff Lake', 'NJ', '07677')]

      mock_cursor.fetchall.return_value = expected_data
      result = get_customers_join(mock_cursor)
      self.assertEqual(result, expected_data)

    def test_get_address(self):
      mock_cursor = Mock()
      expected_data = [('Allan', 'Sherwood', '100 East Ridgewood Ave.', 'Paramus', 'NJ', '07652'),
                       ('Gary', 'Hernandez', '7361 N. 41st St.', 'New York', 'NY', '10012'),
                       ('Barry', 'Zimmer', '16285 Wendell St.', 'Omaha', 'NE', '68135'),
                       ('Frank Lee', 'Wilson', '23 Mountain View St.', 'Denver', 'CO', '80208'),
                       ('Heather', 'Esway', '2381 Buena Vista St.', 'Los Angeles', 'CA', '90023'),
                       ('Erin', 'Valentino', '6982 Palm Ave.', 'Fresno', 'CA', '93711'),
                       ('David', 'Goldstein', '186 Vermont St.', 'San Francisco', 'CA', '94110'),
                       ('Christine', 'Brown', '19270 NW Cornell Rd.', 'Beaverton', 'OR', '97006')]

      mock_cursor.fetchall.return_value = expected_data
      result = get_address(mock_cursor)
      self.assertEqual(result, expected_data)

if __name__ == '__main__':
    unittest.main()
