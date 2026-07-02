const fs = require('fs');
let data = fs.readFileSync('src/mockData.ts', 'utf-8');

const categories = ["Deportes", "Gastronomía", "Cultura", "Naturaleza", "Juegos", "Bienestar"];

let nextCategory = 0;
data = data.replace(/(title: "[^"]*",\n\s*description: "[^"]*",\n)/g, (match) => {
    const category = categories[nextCategory % categories.length];
    nextCategory++;
    return match + `    categoria: "${category}",\n`;
});

fs.writeFileSync('src/mockData.ts', data);
