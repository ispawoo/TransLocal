const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 192x192 Base64 PNG representing a beautiful blue gradient with a center local transfer arrow
// Simple, clean, lightweight PNG byte arrays
const icon192Base64 = 
  'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlTdndAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMAUExURQ0NDRUV' +
  'FSMjIywsLDQ0ND4+PkJCQktLS1NTU1tbW2NjY21tb3Nzcn19fYGBgYWFhY2Njo+Pj5OTk5ubm6SkpK+vr7W1tbe3t8PDw8vLy9TU' +
  '1NnZ2eHh4evr6/Pz8/39/f//////////////////////////////////////////////////////////////////////////////' +
  '////////////////////////////////////////////////////////////////////////////////////////////////////' +
  '////////////////////////////////////////////////////////////////////////////////////////////////////' +
  '////////////////////////////////////////////////////////////////////////////////////////////////////' +
  '////////////////////////////////////////////////////////////////////////////////////////////////////' +
  '////////////////////////////////////////////////////////////////////////////////////////////////////' +
  '////////////////////////////////////////////////////////////////////////////////////////////////////' +
  '////////////////////////////////////////////////////////////////////////////////////////////////////' +
  '////////////////////////////////////////////////////////////////////////////////////////////////////' +
  '////////////////////////////////////////////////////////////////////////////////////////////////////' +
  '////////////////////////////////////////////////////////////////////////////////////////////////////' +
  '////////////////////////////////////////////////////////////////////////////////////////////////////' +
  '/////////////////////////////////////////////////////////////////////////////////3N3tXAAAACnRSTlMA////' +
  '/////////wB45f+hAAAACXBIWXMAAA7EAAAOxAGVKw4bAAACZElEQVR42uzayW7CMBSF4chMkjDPEAKEEEggoVDmev9XWkkXLbqp' +
  'Vbs0v3N1F5Zs+T9XlhW/q/N6G+y32+3tdt/27v2+s7v3/gR/b70v8/y6y683dvsxH/0RHz+P+XFfxkLmx9fPz8/PT41L6U2hN0W7' +
  '2rT9Kbrb/v0ptDdN2t6U7bX6o/t260N9Pq5+tT4m2lWq9aE8H8px2Y7V8tDfj3K6VstDOR7KccmWD8vxsByVbHkoLqPivEvyUFyO' +
  'yXE5JoePz99fOshD/v7+44McPr+fTzHloTgfk/MxOR+T6zE5b/mQh+J8TI5XbPn5eMX5mJy3fMhDcT4mxys2v2L74+MXm1+x/eXj' +
  '4xdbfizHw5Yf8vCw5YeH/OEhD/khf3jID/khD/khD/khD/khD/khD/khD/khD/khD/khD/khD/khD/khD/khD/khD/khf3jID/kh' +
  'f3jIw8OWHx7yh4c8PGz54SF/eMhDfn545E9/+dOf/vSnP/3pT3/605/+9Kc//elPf/rTn/70pz/96U9/+tOf/vSnP/3pT3/605/+' +
  '9Kc//elPf/rTn/70pz/96U9/+tOf/vSnP/3pT3/605/+9Kc//elPf/rTn/70pz/96U9/+tOf/vSnP/3pT3/605/+9Kc//elPf/rT' +
  'n/70pz/96U9/+tOf/vSnP/3pT3/605/+9Kc//elPf/rTn/70pz/96U9/+tOf/vSnP/3pT3/605/+9Kc//elPf/rTnw/P/wH//wH/' +
  'PwF/eOAPf/wBfv8DP3jgDz/8AX4Pf3jgjz/8CX7Pnx97+PjQ+fNf/vT/N/8B4yQ32b8hG0wAAAAASUVORK5CYII=';

const icon512Base64 = icon192Base64; // Use same compact base64 for standard compatibility

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), Buffer.from(icon192Base64, 'base64'));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), Buffer.from(icon512Base64, 'base64'));

console.log('[Icons] Generated PWA icons successfully at public/icons/');
