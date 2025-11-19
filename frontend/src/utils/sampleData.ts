import { DataField } from '../types/chart';

export const sampleDataFields: DataField[] = [
  { id: 'month', name: 'Month', type: 'string' },
  { id: 'sales', name: 'Sales', type: 'number' },
  { id: 'revenue', name: 'Revenue', type: 'number' },
  { id: 'customers', name: 'Customers', type: 'number' },
  { id: 'date', name: 'Date', type: 'date' },
  { id: 'region', name: 'Region', type: 'string' },
  { id: 'product', name: 'Product', type: 'string' },
  { id: 'profit', name: 'Profit', type: 'number' },
  { id: 'quantity', name: 'Quantity', type: 'number' },
  { id: 'category', name: 'Category', type: 'string' },
];

export const generateSampleData = (): Record<string, unknown>[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const regions = ['North', 'South', 'East', 'West'];
  const products = ['Product A', 'Product B', 'Product C', 'Product D'];
  const categories = ['Electronics', 'Clothing', 'Food', 'Books'];

  return months.map((month, index) => ({
    Month: month,
    Sales: Math.floor(Math.random() * 5000) + 3000,
    Revenue: Math.floor(Math.random() * 10000) + 5000,
    Customers: Math.floor(Math.random() * 500) + 200,
    Date: `2024-${String(index + 1).padStart(2, '0')}-01`,
    Region: regions[index % regions.length],
    Product: products[index % products.length],
    Profit: Math.floor(Math.random() * 3000) + 1000,
    Quantity: Math.floor(Math.random() * 200) + 50,
    Category: categories[index % categories.length],
  }));
};
