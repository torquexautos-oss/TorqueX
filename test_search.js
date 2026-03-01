import { searchCars } from './server/db.js';
const cars = searchCars('Tata');
console.log(`Found ${cars.length} cars`);
console.log(cars.map(c => c.model_name));
