var fs = require('fs');
var dir = require('node-dir');
var dirName = 'C:\\CetDev\\version9.0\\home\\custom';
var allowedFolders = ['awesome', 'acs', 'panels', 'storage', 'approach', 'further'];
var categories = {};

createFiles();

function createFiles() {
    categories['map'] = {};
    dir.files(dirName, function(err, files) {
        if (err) throw err;

        files = files.filter(filterFile);

        files.forEach(processFile);

        for (key in categories) {
            fs.writeFile('./global-' + key.replace(' ', '-').toLowerCase() + '-domain.json', JSON.stringify(categories[key], null, '\t'), 'utf8', function(err) {
                if (err) console.log(err);
            });
        }
    });
}

function processFile(file) {
    var content = fs.readFileSync(file, 'utf8');
    var data = JSON.parse(content);
    var undecided = { key: '~', name: 'Undecided' };
    var first = true;

    for (gradeLevel in data.children) {
        var grade = data.children[gradeLevel];
        var category = getCategory(grade);

        if (grade.key[0] == '$') {
            if (!categories['map'][grade.key]) {
                categories['map'][grade.key] = { name: grade.name, files: [] };
            }

            var fileName = file.substring(file.lastIndexOf('\\'));

            categories['map'][grade.key].files.push(fileName);
        }
        else if (category == 'Laminate Edge') {
            if (!categories[category]) {
                categories[category] = { key: '', name: category, children: [] };
            }

            if (grade.key == '~') {
                tryAdd(categories[category], grade);
            }

            processTree(categories[category], data);

            break;
        }
        else continue;

        if (!categories[category]) {
            categories[category] = { key: '', name: category, children: [] };

            if (first) {
                tryAdd(categories[category], undecided);

                first = false;
            }
        }

        processLevel(categories[category], grade);
    }
}

function processLevel(target, level) {
    var tree = get(target, level.key);

    if (!tree) {
        tree = { key: level.key, name: level.name, children: [] };
    }

    processTree(tree, level);

    if (valid(tree)) {
        tryAdd(target, tree);
    }
}

function processTree(tree, level) {
    for (nextLevel in level.children) {
        var next = level.children[nextLevel];

        if (next.key[0] == '~') continue;

        tryAdd(tree, next);

        if (next.children) {
            processLevel(tree, next);
        }
    }
}

function valid(tree) {
    if (!tree.children || tree.children.length == 0) return false;
    if (tree.children.length == 1 && tree.children[0].key.indexOf('~') > -1) return false;

    return true;
}

function tryAdd(target, data) {
    if (target.children) {
        if (!get(target, data.key)) {
            target.children.push(data);
        }
    }
}

function get(target, key) {
    for (item in target.children) {
        if (target.children[item].key == key) {
            return target.children[item];
        }
    }

    return null;
}

function filterFile(file) {
    if (!file.endsWith('.json')) return false;
    if (file.indexOf('materials') == -1) return false;

    var allowed = false;

    for (i in allowedFolders) {
        if (file.indexOf('custom\\' + allowedFolders[i]) > -1) {
            allowed = true;
            break;
        }
    }

    return allowed;
}

function getCategory(grade) {
    if (grade.name.indexOf('EDGE') > -1) {
        return 'Laminate Edge';
    }

    if (grade.name.indexOf('Paint Opts') > -1 || grade.key == gradeCode('MATCH') || grade.key == gradeCode('SELPR6')) {
        return 'Paint';
    }

    if (grade.name.indexOf('Lam') > -1) {
        return 'Laminate';
    }

    if (grade.name.indexOf('Veneer') > -1) {
        return 'Veneer';
    }

    var a = 'A'.charCodeAt(0);
    var z = 'Z'.charCodeAt(0);

    for (var i = a; i <= z; i++) {
        var letter = String.fromCharCode(i);

        if (letter == 'L') continue;
        
        if (grade.key == gradeCode(letter) || grade.key == gradeCode(letter + 'COM')) {
            return 'Panel Fabric';
        }
    }

    return 'Seating Upholstery';
}

function gradeCode(key) {
    return '$(' + key + ')';
}