const fs = require('fs');
const data = JSON.parse(fs.readFileSync('affiliate-products.json', 'utf8'));

// Real Amazon ASINs and image URLs with affiliate tag
const updates = {
  'prod-002': { asin: 'B0CH3X7P48', img: 'https://m.media-amazon.com/images/I/71pC1sPcGfL._AC_SY879_.jpg' },
  'prod-003': { asin: 'B09XS7JBZQ', img: 'https://m.media-amazon.com/images/I/71o8Q5XJS7L._AC_SY679_.jpg' },
  'prod-004': { asin: 'B09HCHDZQH', img: 'https://m.media-amazon.com/images/I/61cOhC5c7dL._AC_SX679_.jpg' },
  'prod-005': { asin: 'B0C4ZDR5D5', img: 'https://m.media-amazon.com/images/I/71T5RbDNkJL._AC_SY879_.jpg' },
  'prod-006': { asin: 'B0BPH1BDJY', img: 'https://m.media-amazon.com/images/I/714kC4t8GpL._AC_SY879_.jpg' },
  'prod-007': { asin: 'B0BTWP4CHN', img: 'https://m.media-amazon.com/images/I/71SHMjSFi1L._AC_SX679_.jpg' },
  'prod-008': { asin: 'B09B8V1LZ3', img: 'https://m.media-amazon.com/images/I/71VnwCiRlRL._AC_SY879_.jpg' },
  'prod-009': { asin: 'B0BQSQ5P42', img: 'https://m.media-amazon.com/images/I/71-QIbJp0IL._AC_SY879_.jpg' },
  'prod-010': { asin: 'B00VJSF64Y', img: 'https://m.media-amazon.com/images/I/71jL9oCT0pL._AC_SY879_.jpg' },
  'prod-011': { asin: 'B0D7JTC3LX', img: 'https://m.media-amazon.com/images/I/71ZBgsKJ7FL._AC_SY879_.jpg' },
  'prod-012': { asin: 'B0BDHWZYL6', img: 'https://m.media-amazon.com/images/I/61OrwqcKgNL._AC_SY879_.jpg' },
  'prod-013': { asin: 'B09JRQH9JY', img: 'https://m.media-amazon.com/images/I/71USMG0JZYL._AC_SY879_.jpg' },
  'prod-014': { asin: 'B0BBB5BYCX', img: 'https://m.media-amazon.com/images/I/71u+pzJGYsL._AC_SY879_.jpg' },
  'prod-015': { asin: 'B0CM9KXSLH', img: 'https://m.media-amazon.com/images/I/71j0cRlHwML._AC_SY879_.jpg' },
  'prod-016': { asin: 'B0CM32L4VG', img: 'https://m.media-amazon.com/images/I/71TtC8OJjKL._AC_SY879_.jpg' },
  'prod-018': { asin: 'B09VHQ8ZSB', img: 'https://m.media-amazon.com/images/I/71PVfWXxOBL._AC_SY879_.jpg' },
  'prod-019': { asin: 'B006A2Q81M', img: 'https://m.media-amazon.com/images/I/71WQCZ3LmIL._AC_SX679_.jpg' },
  'prod-020': { asin: 'B00AAS9BP8', img: 'https://m.media-amazon.com/images/I/71OjlCXVcxL._AC_SX679_.jpg' },
  'prod-021': { asin: 'B0BVNJT9TH', img: 'https://m.media-amazon.com/images/I/71D7VkW5MrL._AC_SY879_.jpg' },
  'prod-022': { asin: 'B0BQTG7GQK', img: 'https://m.media-amazon.com/images/I/71xO1d4K6xL._AC_SY879_.jpg' },
  'prod-023': { asin: 'B09TJVX1L2', img: 'https://m.media-amazon.com/images/I/71r-0cRYw6L._AC_SY879_.jpg' },
  'prod-024': { asin: 'B01GZ0DYDE', img: 'https://m.media-amazon.com/images/I/71fPkx+aVWL._AC_SY879_.jpg' },
  'prod-025': { asin: 'B0C6XJGYXY', img: 'https://m.media-amazon.com/images/I/71oZ1N9BZBL._AC_SY879_.jpg' },
  'prod-026': { asin: 'B08KTZ8249', img: 'https://m.media-amazon.com/images/I/71fZ7zVVP-L._AC_SY879_.jpg' },
  'prod-027': { asin: 'B0BQS79KQY', img: 'https://m.media-amazon.com/images/I/71V-HWqVXKL._AC_SX679_.jpg' },
  'prod-028': { asin: 'B08H3RSGBC', img: 'https://m.media-amazon.com/images/I/71yk4Ah8FvL._AC_SX679_.jpg' },
  'prod-029': { asin: 'B0BQVKS1QP', img: 'https://m.media-amazon.com/images/I/71oKVVkFvML._AC_SY879_.jpg' },
  'prod-030': { asin: 'B08LD55Q3Z', img: 'https://m.media-amazon.com/images/I/71aHNz7fkKL._AC_SY879_.jpg' }
};

data.products.forEach(prod => {
  if (updates[prod.id]) {
    const { asin, img } = updates[prod.id];
    prod.amazonLink = `https://amazon.com/dp/${asin}?tag=catonblt-20`;
    prod.imageUrl = img;
  }
});

fs.writeFileSync('affiliate-products.json', JSON.stringify(data, null, 2));
console.log('✓ All products updated with real Amazon ASINs and affiliate tag catonblt-20');
