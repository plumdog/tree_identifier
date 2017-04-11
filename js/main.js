var utils = {
    objEachSorted: function(obj, callback, sortKeyFn) {
        var id = function(x) {
            return x
        };

        sortKeyFn = sortKeyFn || id;

        var convKeys = [];
        var keysMapping = {};
        var convKey;
        for (key in obj) {
            convKey = sortKeyFn(key);
            convKeys.push(convKey);
            if (!keysMapping.hasOwnProperty(convKey)) {
                keysMapping[convKey] = [];
            }
            keysMapping[convKey].push(key);
        }
        convKeys.sort();
        $.each(convKeys, function(i, convKey) {
            $.each(keysMapping[convKey], function(j, realKey) {
                callback(realKey, obj[realKey]);
            });
        });
    },
    arrEachSorted: function(arr, callback, sortKeyFn) {
        var id = function(x) {
            return x
        };

        sortKeyFn = sortKeyFn || id;

        
        var keyToItems = {};
        var key;
        var item;
        for (var i = 0; i < arr.length; i++) {
            item = arr[i];
            key = sortKeyFn(item);

            if (!keyToItems.hasOwnProperty(key)) {
                keyToItems[key] = [];
            }

            keyToItems[key].push(item);
        }

        var keys = [];
        for (key in keyToItems) {
            keys.push(key);
        }
        keys.sort();

        var overallIndex = 0;

        $.each(keys, function(index, key) {
            $.each(keyToItems[key], function(index2, item) {
                callback(overallIndex, item);
                overallIndex++;
            });
        });
    },
    capitalize: function(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
};

class Identifier {
    constructor(args) {
        var {category, name, options, depends} = args;
        this.category = category || 'Other';
        this.name = name;
        this.options = options;
        this.depends = depends || [];
    }

    optionIsValid(option) {
        return this.options.hasOwnProperty(option)
    }

    optionName(option) {
        if (!this.optionIsValid(option)) {
            throw 'No such option ' + option;
        }

        var info = this.options[option];

        return info.name || utils.capitalize(option);
    }
}

var _bool = function(args) {
    var {category, name, depends} = args;

    return new Identifier({
        category: category,
        name: name,
        options: {
            true: {
                name: 'Yes'
            },
            false: {
                name: 'No'
            }
        },
        depends: depends || []
    });
};

class Dependency {
    constructor(args) {
        var {identifier, option, hard} = args;
        this.identifier = identifier;
        this.option = option;
        this.hard = Boolean(hard);
    }
}

var defaultCategory = '__defaultCategory';

var leafType = new Identifier({
    category: defaultCategory,
    name: 'Leaf Type',
    options: {
        needles: {},
        scales: {},
        broad: {}
    }
});

var coneShape = new Identifier({
    category: 'Cone',
    name: 'Cone Shape',
    options: {
        barrel: {},
        egg: {}
    },
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'needles'
        })
    ]
    
});

var leafColour = new Identifier({
    category: 'Leaf Colour',
    name: 'Leaf Colour',
    options: {
        darkGreen: {
            name: "Dark green"
        },
        shiny: {}
    }
});

var leafToothed = new Identifier({
    category: 'Leaf Shape',
    name: 'Leaf Toothed',
    options: {
        none: {},
        minute: {},
        medium: {},
        large: {},
        double: {},
        small: {},
        coarse: {}
    },
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
});

var compound = new Identifier({
    category: 'Leaf Arrangement',
    name: 'Leaf Structure',
    options: {
        compoundFiveEndOfStalk: {
            name: 'Five from end of the stalk'
        },
        compoundPairs: {
            name: 'In pairs'
        },
        simple: {}
    },
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
});

var shape = new Identifier({
    category: 'Leaf Shape',
    name: 'Shape',
    options: {
        longThin: {
            name: 'Long thin'
        },
        round: {}
    },
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
});

var length = new Identifier({
    category: 'Leaf Shape',
    name: 'Leaf Length',
    options: {
        moreThan10cm: {
            name: "More than 10cm"
        },
        lessThan10cm: {
            name: "Less than 10cm"
        }
    },
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
});

var leafTipShape = new Identifier({
    category: 'Leaf Shape',
    name: 'Leaf tip shape',
    options: {
        blunt: {},
        tapered: {},
        abrupt: {}
    },
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
});

var leafletPairsArrangement = new Identifier({
    category: 'Leaf Arrangement',
    name: 'Leaflet pairs arrangement',
    options: {
        symmetric: {},
        alternate: {}
    },
    depends: [
        new Dependency({
            identifier: compound,
            option: 'compoundPairs',
            hard: true
        })
    ]
});

var lobed = _bool({
    category: 'Leaf Shape',
    name: 'Lobed',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
});

var lobedRibs = new Identifier({
    category: 'Leaf Shape',
    name: "Lobed Ribs",
    options: {
        radial: {},
        spinal: {}
    },
    depends: [
        new Dependency({
            identifier: lobed,
            option: true
        })
    ]
});


var twigSideShoots = _bool({
    category: 'Twig',
    name: 'Twig side shoots'
});
var suckerBase = _bool({
    category: 'Leaf Stalk',
    name: 'Needle sucker base',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'needles',
            hard: true
        })
    ]
});
var pegLeftWhenRemoved = _bool({
    category: 'Leaf Stalk',
    name: 'Needle peg left when removed',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'needles',
            hard: true
        })
    ]
});
var needlesAllDirections = _bool({
    category: 'Leaf Arrangement',
    name: 'Needles all directions',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'needles',
            hard: true
        })
    ]
});
var needlesUndersideTwoWhiteLines = _bool({
    category: 'Leaf Colour',
    name: 'Needles underside two white lines',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'needles',
            hard: true
        })
    ]
});
var pineappleSmell = _bool({
    category: 'Leaf Smell',
    name: 'Pineapple smell when leaves crushed',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'scales',
            hard: true
        })
    ]
});
var sharpWhiteBand = _bool({
    category: 'Leaf Colour',
    name: 'Sharp white band',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'needles'
        })
    ]
});
var needlePairsThreeOrFive = _bool({
    category: 'Leaf Arrangement',
    name: 'Needle pairs - three or five',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'needles',
            hard: true
        })
    ]
});
var leafletsTwoOrThreePairs = _bool({
    category: 'Leaf Arrangement',
    name: 'Leaflets two or three pairs',
    depends: [
        new Dependency({
            identifier: compound,
            option: 'compoundPairs',
            hard: true
        })
    ]
});
var leafletsManyPairs = _bool({
    category: 'Leaf Arrangement',
    name: 'Leaflets many pairs',
    depends: [
        new Dependency({
            identifier: compound,
            option: 'compoundPairs',
            hard: true
        })
    ]
});

var lobedEdge = _bool({
    category: 'Leaf Shape',
    name: 'Lobed edge',
    depends: [
        new Dependency({
            identifier: lobed,
            option: true,
            hard: true
        })
    ]
});
var lobedEdgeShape = new Identifier({
    category: 'Leaf Shape',
    name: "Lobed edge shape",
    options: {
        thorny: {},
        toothed: {}
    },
    depends: [
        new Dependency({
            identifier: lobedEdge,
            option: true,
            hard: true
        })
    ]
});
var lobesThreeToEight = _bool({
    category: 'Leaf Shape',
    name: 'Lobes three to eight',
    depends: [
        new Dependency({
            identifier: lobedEdge,
            option: true,
            hard: true
        })
    ]
});

var leafStalkRed = _bool({
    category: 'Leaf Stalk',
    name: 'Leaf stalk red'
});
var twigsShinyDarkBrown = _bool({
    category: 'Twig',
    name: 'Twigs shiny dark brown'
});
var darkGreenAbove = _bool({
    category: 'Leaf Colour',
    name: 'Dark green above'
});
var whiteWoolyAbove = _bool({
    category: 'Leaf Hairs',
    name: 'White wooly above'
});
var budAtBaseShortStalk = _bool({
    category: 'Leaf Stalk',
    name: 'Bud at base short stalk'
})
var glossyDarkGreenAbove = _bool({
    category: 'Leaf Colour',
    name: 'Glossy dark green above'
});
var whiteHairsBeneath = _bool({
    category: 'Leaf Hairs',
    name: 'White hairs beneath'
});

var heartShaped = _bool({
    category: 'Leaf Shape',
    name: 'Heart shaped'
});
var paleGreenBeneath = _bool({
    category: 'Leaf Colour',
    name: 'Pale green beneath'
});
var veryHairy = _bool({
    category: 'Leaf Hairs',
    name: 'Very hairy'
});
var smooth = _bool({
    category: 'Leaf Texture',
    name: 'Smooth'
});
var flattenedLeafStalk = _bool({
    category: 'Leaf Stalk',
    name: 'Flattened leaf stalk'
});
var stemWhiteHairs = _bool({
    category: 'Leaf Stalk',
    name: 'Stem white hairs'
});
var stalkWhiteHairs = _bool({
    category: 'Leaf Stalk',
    name: 'Stalk white hairs'
});
var softlyHairy = _bool({
    category: 'Leaf Hairs',
    name: 'Softly hairy'
});
var veins = _bool({
    category: 'Leaf Texture',
    name: 'Veins'
});
var wavyEdge = _bool({
    category: 'Leaf Shape',
    name: 'Wavy edge'
});


class BoundIdentifier {
    constructor(identifier, selectedOptions) {
        $.each(selectedOptions, function(index, option) {
            if (!identifier.optionIsValid(option)) {
                throw "Invalid option " + option + " for " + identifier.name;
            }
        });
        this.identifier = identifier;
        this.options = selectedOptions;
    }
}

class Item {
    constructor(name) {
        this.name = name;
        this.identification = [];
    }
    id(identifier /* varargs */) {
        var selectedOptions = Array.prototype.slice.call(arguments, 1);
        this.identification.push(new BoundIdentifier(identifier, selectedOptions))
        return this;
    }
}

var trees = [
    new Item('Juniper')
        .id(leafType, 'needles')
        .id(sharpWhiteBand, true),
    new Item('Pines')
        .id(leafType, 'needles')
        .id(needlePairsThreeOrFive, true),
    new Item('Cedar')
        .id(leafType, 'needles')
        .id(twigSideShoots, true)
        .id(coneShape, 'barrel'),
    new Item('Larch')
        .id(leafType, 'needles')
        .id(twigSideShoots, true)
        .id(coneShape, 'egg'),
    new Item('Firs')
        .id(leafType, 'needles')
        .id(twigSideShoots, false)
        .id(suckerBase, true),
    new Item('Spruce')
        .id(leafType, 'needles')
        .id(twigSideShoots, false)
        .id(suckerBase, false)
        .id(pegLeftWhenRemoved, true),
    new Item('Douglas Fir')
        .id(leafType, 'needles')
        .id(twigSideShoots, false)
        .id(suckerBase, false)
        .id(pegLeftWhenRemoved, false)
        .id(needlesAllDirections, true),
    new Item('Western Hemlock')
        .id(leafType, 'needles')
        .id(twigSideShoots, false)
        .id(suckerBase, false)
        .id(pegLeftWhenRemoved, false)
        .id(needlesAllDirections, false)
        .id(needlesUndersideTwoWhiteLines, true),
    new Item('Yew')
        .id(leafType, 'needles')
        .id(twigSideShoots, false)
        .id(suckerBase, false)
        .id(pegLeftWhenRemoved, false)
        .id(needlesAllDirections, false)
        .id(needlesUndersideTwoWhiteLines, false),
    new Item('Cypress')
        .id(leafType, 'scales')
        .id(pineappleSmell, false),
    new Item('Western Red Cedar')
        .id(leafType, 'scales')
        .id(pineappleSmell, true),
    new Item('Horse Chestnut')
        .id(leafType, 'broad')
        .id(compound, 'compoundFiveEndOfStalk'),
    new Item('Elder')
        .id(leafType, 'broad')
        .id(compound, 'compoundPairs')
        .id(leafletsTwoOrThreePairs, true),
    new Item('Ash')
        .id(leafType, 'broad')
        .id(compound, 'compoundPairs')
        .id(leafletsManyPairs, true)
        .id(leafletPairsArrangement, 'symmetric'),
    new Item('Rowan')
        .id(leafType, 'broad')
        .id(compound, 'compoundPairs')
        .id(leafletsManyPairs, true)
        .id(leafletPairsArrangement, 'alternate'),
    new Item('Sycamore')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobedRibs, 'radial')
        .id(leafToothed, 'medium'),
    new Item('Field Maple')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, true)
        .id(lobedRibs, 'radial')
        .id(leafToothed, 'none')
        .id(lobedEdge, true),
    // idBool('symmetricPairs') true),  // ?
    new Item('London Plane')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, true)
        .id(lobedRibs, 'radial')
        .id(leafToothed, 'none')
        .id(lobedEdge, true),
    // idBool('alternatePairs') true),
    new Item('Oak')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, true)
        .id(lobedRibs, 'spinal')
        .id(lobesThreeToEight, true),
    new Item('Hawthorn')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, true)
        .id(lobedRibs, 'spinal')
        .id(lobesThreeToEight, false)
        .id(lobedEdgeShape, 'thorny'),
    new Item('Wild Service Tree')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, true)
        .id(lobedRibs, 'spinal')
        .id(lobesThreeToEight, false)
        .id(lobedEdgeShape, 'toothed'),
    new Item('Willow')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'longThin')
        .id(length, 'moreThan10cm')
        .id(leafToothed, 'minute'),
    new Item('Bird Cherry')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'longThin')
        .id(length, 'moreThan10cm')
        .id(leafToothed, 'medium'),
    new Item('Sweet Chestnut')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'longThin')
        .id(length, 'moreThan10cm')
        .id(leafToothed, 'large'),
    new Item('Hornbeam')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'longThin')
        .id(length, 'lessThan10cm')
        .id(leafStalkRed, true)
        .id(leafToothed, 'double'),
    new Item('Bird Cherry')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'longThin')
        .id(length, 'lessThan10cm')
        .id(twigsShinyDarkBrown, true)
        .id(leafToothed, 'small'),
    new Item('Holm Oak')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(darkGreenAbove, true)
        .id(whiteWoolyAbove, true),
    //stemColour: 'grey-brown')
    //stemHairs: 'short pale-brown'
    new Item('Crab Apple')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(darkGreenAbove, true)
        .id(whiteWoolyAbove, true)
        .id(budAtBaseShortStalk, true),
    new Item('Whitebeam')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(darkGreenAbove, true)
        .id(whiteWoolyAbove, true)
        .id(glossyDarkGreenAbove, true)
        .id(whiteHairsBeneath, true),
    new Item('Lime')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(leafTipShape, 'abrupt')
        .id(heartShaped, true)
        .id(darkGreenAbove, true)
        .id(paleGreenBeneath, true),
    new Item('Hazel')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(leafTipShape, 'abrupt')
        .id(veryHairy, true),
    new Item('Poplar')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(leafTipShape, 'abrupt')
        .id(smooth, true)
        .id(flattenedLeafStalk, true),
    new Item('Silver Birch')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium', 'coarse', 'double')
        .id(leafTipShape, 'tapered'),
    new Item('Downy Birch')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(leafTipShape, 'tapered')
        .id(stemWhiteHairs, true)
        .id(stalkWhiteHairs, true),
    new Item('Common Alder')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'none')
        .id(leafTipShape, 'blunt')
        .id(leafColour, 'darkGreen'),
    new Item('Goat Willow')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'none')
        .id(softlyHairy, true)
        .id(veins, true),
    new Item('Beech')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'none')
        .id(leafColour, 'shiny')
        .id(wavyEdge, true)
];


class TreeTable {
    constructor($table) {
        this.$table = $table;
        this.identifiers = [];
    }

    reset() {
        this.$table.find('tbody').empty();
    }

    load(rows) {
        this.reset();
        var self = this;
        utils.arrEachSorted(
            rows,
            function(index, row) {
                self.addRow(row);
            },
            function(item) {
                return item.name;
            }
        );
    }

    addRow(row) {
        var $tr = $('<tr/>');
        var $species = $('<td/>').text(row.name);
        var $identification = $('<td/>');
        var $identificationList = $('<ul>')
        $.each(row.identification, function(index, value) {
            var optionNames = [];
            $.each(value.options, function(i, option) {
                optionNames.push(value.identifier.optionName(option));
            });
            $identificationList.append(
                $('<li>').text(value.identifier.name + ': ' + optionNames)
            );
        });
        $identification.append($identificationList);

        $tr.append($species);
        $tr.append($identification);

        this.$table.find('tbody').append($tr);
    };
}

class Finder {
    constructor(items) {
        this.items = items;
    }

    getIdentifiers() {
        var found = {};
        $.each(this.items, function(index, item) {
            $.each(item.identification, function(idIndex, identifier) {
                if (!found.hasOwnProperty(identifier.identifier.name)) {
                    found[identifier.identifier.name] = identifier.identifier;
                }
            });
        });
        return found;
    }

    itemMatches(item, identifier, value) {
        var matches = false;



        $.each(item.identification, function(index, id) {
            var trialIdentifier = id.identifier;
            var selectedOptions = id.options;



            // Not the right identifier - ignore
            if (!Object.is(identifier, trialIdentifier)) {
                return true;  // continue
            }

            // Correct identifier, check if the selected value matches
            // the item's values.
            matches = ($.inArray(value, selectedOptions) !== -1);
            return false;
        });

        return matches;
    }

    itemMatchesAll(item, identifiersAndValues) {
        var self = this;
        var matchesAll = true;
        $.each(identifiersAndValues, function(index, identifierAndValue) {
            var identifier = identifierAndValue[0];
            var value = identifierAndValue[1];
            if (!self.itemMatches(item, identifier, value)) {
                matchesAll = false;
                return false;
            }
        });
        return matchesAll;
    }

    getFilteredItems(identifiersAndValues) {
        var filteredItems = [];
        var self = this;
        $.each(this.items, function(index, item) {
            if (self.itemMatchesAll(item, identifiersAndValues)) {
                filteredItems.push(item);
            }
        });
        return filteredItems;
    }
}

class FinderForm {
    constructor(identifiers, callback) {
        this.identifiers = identifiers;
        // Callback to be called when the form changes, called with an
        // array of pairs [identifier, selectedValue]
        this.callback = callback;
    }

    getCategorisedIdentifiers() {
        var categorised = {};

        $.each(this.identifiers, function(index, identifier) {
            if(!categorised.hasOwnProperty(identifier.category)) {
                categorised[identifier.category] = [];
            }
            categorised[identifier.category].push(identifier);
        });

        return categorised;
    }

    getElement() {
        var $form = $('<form/>');
        var self = this;
        utils.objEachSorted(
            this.getCategorisedIdentifiers(),
            function(category, identifiers) {
                var $rowsDiv = $('<div/>');
                utils.arrEachSorted(
                    identifiers,
                    function(index, identifier) {
                        var $row = $('<div/>').addClass('form-group row');
                        $row.append(self.getLabel(identifier));
                        $row.append($('<div/>').addClass('col-xs-6').append(self.getInput(identifier)));
                        $rowsDiv.append($row);
                    },
                    function(item) {
                        return item.name;
                    }
                );

                if (category == defaultCategory) {
                    $form.append($rowsDiv)
                } else {
                    var $catDiv = $('<div/>').addClass('outer');
                    var $catLink = $('<a/>').attr('href', '#').text(category);
                    $catLink.on('click', function() {
                        $(this).closest('.outer').find('.inner').toggleClass('hide');
                        return false;
                    });
                    $catDiv.append($('<h3/>').append($catLink));
                    $catDiv.append($rowsDiv.addClass('inner hide'));
                    $form.append($catDiv);
                }
            },
            function(category) {
                if (category == defaultCategory) {
                    return -1;
                }
                return category;
            }
        );
        this.hideFields($form, []);
        return $form;
    };

    getSlugName(identifier) {
        return identifier.name.replace(' ', '_').toLowerCase();
    };

    getLabel(identifier) {
        return $('<label/>')
            .attr('for', 'id_' + this.getSlugName(identifier))
            .addClass('col-xs-4 col-form-label')
            .text(identifier.name);
    };

    onChange($inputElement) {
        var $form = $inputElement.closest('form');
        var formValues = {};
        var $input;

        $form.find('select').each(function() {
            $input = $(this);

            if ($input.val() !== '') {
                var typedVal = $input.val();
                if (typedVal == 'true') {
                    typedVal = true;
                } else if (typedVal == 'false') {
                    typedVal = false;
                }
                formValues[$input.attr('name')] = typedVal;
            }
        });

        var values = [];
        var slug;
        var value;
        var self = this;
        $.each(this.identifiers, function(name, identifier) {
            slug = self.getSlugName(identifier);
            value = formValues[slug];
            if (value !== undefined) {
                values.push([identifier, formValues[slug]]);
            }
        });

        this.callback(values);

        this.hideFields($form, values);
    }

    hideFields($form, identifiersAndValues) {
        $form.find('.form-group').removeClass('hide');
        var self = this;

        var depsSatisfied = function(trialIdentifier, identifiersAndValues) {
            if (trialIdentifier.depends.length == 0) {
                return true;
            }

            var allSatisfied = true;
            $.each(trialIdentifier.depends, function(index, dependency) {
                var depIdentifier = dependency.identifier;
                var depValue = dependency.option;

                var depSatisfied = null;

                $.each(identifiersAndValues, function(index2, selectedIdentifierAndValue) {
                    var selectedIdentifier = selectedIdentifierAndValue[0];
                    var selectedValue = selectedIdentifierAndValue[1];

                    if (!Object.is(selectedIdentifier, depIdentifier)) {
                        return true;
                    }

                    if (selectedValue !== depValue) {
                        depSatisfied = false;
                        return false;
                    } else {
                        depSatisfied = true;
                        return true
                    }
                });

                if (depSatisfied === null) {
                    depSatisfied = !dependency.hard;
                }

                if (!depSatisfied) {
                    allSatisfied = false;
                    return false;
                }

                if (!depsSatisfied(depIdentifier, identifiersAndValues)) {
                    allSatisfied = false;
                    return false;
                }

            });
            return allSatisfied;
        };

        $form.find('select').each(function() {
            var $input = $(this);
            var inputIdentifier = $input.data('identifier');

            if (!depsSatisfied(inputIdentifier, identifiersAndValues)) {
                $input.closest('.form-group').addClass('hide');
            }
        });

        $form.find('.outer').addClass('hide');
        $form.find('.form-group').not('.hide').closest('.outer').removeClass('hide');
    }

    getInput(identifier) {
        var $input = $('<select/>')
            .attr('name', this.getSlugName(identifier))
            .attr('id', 'id_' + this.getSlugName(identifier))
            .addClass('form-control');
        $input.append($('<option/>').attr('value', '').text('--'))
        var toTypes = {};
        var stringed;
        $.each(identifier.options, function(option, info) {
            $input.append(
                $('<option/>')
                    .attr('value', option)
                    .text(identifier.optionName(option))
            );
        });
        $input.data('identifier', identifier);

        var self = this;

        $input.on('change', function() {
            self.onChange($(this));
        });
        return $input;
    };
}

$(document).ready(function() {
    var $table = $('table.tree-table');
    var table = new TreeTable($table);
    table.load(trees);

    var treeFinder = new Finder(trees);

    var $formWrapper = $('div.tree-form-wrapper');
    var finderForm = new FinderForm(treeFinder.getIdentifiers(), function(values) {
        var filteredTrees = treeFinder.getFilteredItems(values);
        table.load(filteredTrees);
    });
    $formWrapper.html(finderForm.getElement());
});
