const fs = require('fs');

function getContact (path) {
    const contact = fs.readFileSync(path, {encoding: 'utf-8'})
    return contact;
}

function getContent (path,name) {
    const refinedName = name.trim();
    const content = fs.readFileSync(path,{encoding: 'utf-8'})
    const refinedContent = content.replace('${name}', refinedName);
    return refinedContent;
  }

module.exports = { getContact,getContent }