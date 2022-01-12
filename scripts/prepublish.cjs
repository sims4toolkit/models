const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const getPath = string => path.resolve(__dirname, string);

// generate package file
delete pkg.devDependencies;
delete pkg.scripts;
fs.writeFileSync(getPath('../dst/package.json'), JSON.stringify(pkg, null, '\t'));

// copy README, LICENSE, and CHANGELOG
['LICENSE', 'README.md', 'CHANGELOG.md'].forEach(filename => {
  fs.copyFileSync(getPath(`../${filename}`), getPath(`../dst/${filename}`));
});
