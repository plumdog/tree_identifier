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
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    },
    title: function(s) {
        return s.replace(
                /\w\S*/g,
            function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }
};

class Identifier {
    constructor(args) {
        var {category, name, options, depends, pointDelta} = args;
        this.category = category || 'Other';
        this.name = name;
        this.options = options;
        this.depends = depends || [];
        if (typeof(pointDelta) === 'undefined') {
            pointDelta = 2.0;
        }
        // The score to deduct from perfect (1.0) if the options have
        // no point values assigned and the values do not match.
        this.pointDelta = pointDelta;
    }

    getSlugName() {
        return this.name.replace(new RegExp(' ', 'g'), '_').toLowerCase();
    };

    optionIsValid(option) {
        return this.options.hasOwnProperty(option)
    }

    _assertOptionValid(option) {
        if (!this.optionIsValid(option)) {
            throw 'No such option ' + option;
        }
    }

    optionName(option) {
        this._assertOptionValid(option);

        var info = this.options[option];

        return info.name || utils.capitalize(option);
    }

    depsSatisfied(identifiersAndValues) {
        if (this.depends.length == 0) {
            return true;
        }

        var allSatisfied = true;
        $.each(this.depends, function(index, dependency) {
            var depSatisfied = dependency.satisfied(identifiersAndValues);

            if (!depSatisfied) {
                allSatisfied = false;
                return false;
            }

            if (!dependency.identifier.depsSatisfied(identifiersAndValues)) {
                allSatisfied = false;
                return false;
            }
        });
        return allSatisfied;
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
        var {identifier, option, hard, invert} = args;
        this.identifier = identifier;
        this.option = option;
        this.hard = Boolean(hard);
        this.invert = Boolean(invert);
    }

    satisfied(identifiersAndValues) {
        var depIdentifier = this.identifier;
        var depValue = this.option;

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
            depSatisfied = !this.hard;
        }

        if (this.invert) {
            depSatisfied = !depSatisfied;
        }

        return depSatisfied;
    }
}

var defaultCategory = '__defaultCategory';

var leafType = new Identifier({
    category: defaultCategory,
    name: 'Leaf type',
    options: {
        needles: {},
        scales: {},
        broad: {}
    }
});

var coneShape = new Identifier({
    category: 'Cone',
    name: 'Cone shape',
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
    name: 'Leaf colour',
    options: {
        darkGreen: {
            name: "Dark green"
        },
        shiny: {}
    }
});

var leafToothed = new Identifier({
    category: 'Leaf Shape',
    name: 'Leaf toothed',
    options: {
        none: {point: 0.0},
        minute: {point: 0.5},
        small: {point: 0.8},
        medium: {point: 1.0},
        large: {point: 0.5},
        double: {point: 2.0},
        // coarse: {}
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
    name: 'Leaf structure',
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
            name: 'Long thin',
            point: 0.0
        },
        round: {
            point: 1.5
        }
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
    name: 'Leaf length',
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
    name: "Lobed ribs",
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
    name: 'White wooly above',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
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
    name: 'White hairs beneath',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
});

var heartShaped = _bool({
    category: 'Leaf Shape',
    name: 'Heart shaped',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
});
var paleGreenBeneath = _bool({
    category: 'Leaf Colour',
    name: 'Pale green beneath'
});
var veryHairy = _bool({
    category: 'Leaf Hairs',
    name: 'Very hairy',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
});
var smooth = _bool({
    category: 'Leaf Texture',
    name: 'Smooth',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
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
    name: 'Softly hairy',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
});
var veins = _bool({
    category: 'Leaf Texture',
    name: 'Veins',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
});
var wavyEdge = _bool({
    category: 'Leaf Shape',
    name: 'Wavy edge',
    depends: [
        new Dependency({
            identifier: leafType,
            option: 'broad'
        })
    ]
});


class BoundIdentifier {
    constructor(identifier, selectedOption) {
        if (!identifier.optionIsValid(selectedOption)) {
            throw "Invalid option " + selectedOption + " for " + identifier.name;
        }
        this.identifier = identifier;
        this.option = selectedOption;
    }

    optionScore(option) {
        if (!this.identifier.optionIsValid(option)) {
            throw "Invalid selected option " + option + " for " + this.identifier.name;
        }

        var selectedOptionInfo = this.identifier.options[option];
        var correctOptionInfo = this.identifier.options[this.option];

        var selectedScorePoint = selectedOptionInfo['point'];
        var correctScorePoint = correctOptionInfo['point'];

        if ((typeof(selectedScorePoint) !== 'undefined') && (typeof(correctScorePoint) !== 'undefined')) {
            var dist = Math.abs(selectedScorePoint - correctScorePoint);
            return 1.0 - dist;
        }

        

        if (option === this.option) {
            return 1.0;
        }

        return 1.0 - this.identifier.pointDelta;
    }
}

class Item {
    constructor(name) {
        this.name = name;
        this.identification = [];
    }
    id(identifier, selectedOption) {
        this.identification.push(new BoundIdentifier(identifier, selectedOption))
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
        .id(leafToothed, 'medium')
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

// trees = [trees[0], trees[20]];


class TreeTable {
    constructor($table) {
        this.$table = $table;
        this.identifiers = [];
    }

    reset(includeScores) {
        this.$table.find('tbody').empty();
        this.$table.find('th.score').toggle(includeScores);
    }

    loadMatched(matchedRows, includeScores) {
        if (typeof(includeScores) == 'undefined') {
            includeScores = true;
        }

        var self = this;
        this.reset(includeScores);
        $.each(matchedRows, function(index, row) {
            self.addRow(row, includeScores);
        });
    }

    addRow(row, includeScores) {
        includeScores = Boolean(includeScores);

        var item = row.item;
        var score = row.getScore();

        var $tr = $('<tr/>');
        var $species = $('<td/>').text(item.name);
        var $identification = $('<td/>');
        var $identificationList = $('<ul>').addClass('identification');
        $.each(item.identification, function(index, value) {
            $identificationList.append(
                $('<li>')
                    .addClass('identifier identifier-' + value.identifier.getSlugName())
                    .text(value.toString())
            );
        });

        $identification.append($identificationList);

        $tr.append($species);
        $tr.append($identification);
        $identificationList.data('identification', item.identification);

        if (includeScores) {
            var $score = $('<td/>').text(score);
            $tr.append($score);
        }

        var self = this;

        $tr.on('click', function() {
            $tr.toggleClass('selected');

            var $selected = self.$table.find('tr.selected');
            if ($selected.length > 2) {
                $selected.not($tr).removeClass('selected');
            }

            $selected = self.$table.find('tr.selected');
            if ($selected.length == 2) {
                self.highlightDiff(
                    $($selected[0]),
                    $($selected[1])
                )
            } else {
                self.clearDiff();
            }

            return false;
        })

        this.$table.find('tbody').append($tr);
    }

    clearDiff() {
        this.$table.find('.identifier').removeClass('selected-matching selected-differing selected-maybe');
    }

    highlightDiff($tr1, $tr2) {
        var identification1 = $tr1.find('.identification').data('identification');
        var identification2 = $tr2.find('.identification').data('identification');

        var matchingSlugs = [];
        var differingSlugs = [];
        var slug;
        $.each(identification1, function(i, boundIdentifier1) {
            $.each(identification2, function(j, boundIdentifier2) {
                if (Object.is(boundIdentifier1.identifier, boundIdentifier2.identifier)) {
                    slug = boundIdentifier1.identifier.getSlugName();
                    if (boundIdentifier1.option === boundIdentifier2.option) {
                        matchingSlugs.push(slug);
                    } else {
                        differingSlugs.push(slug);
                    }
                }
            });
        });

        $.each(matchingSlugs, function(i, slug) {
            $tr1.find('.identifier-' + slug).addClass('selected-matching');
            $tr2.find('.identifier-' + slug).addClass('selected-matching');
        });

        $.each(differingSlugs, function(i, slug) {
            $tr1.find('.identifier-' + slug).addClass('selected-differing');
            $tr2.find('.identifier-' + slug).addClass('selected-differing');
        });
        $tr1.find('.identifier').not('.selected-matching').not('.selected-differing').addClass('selected-maybe');
        $tr2.find('.identifier').not('.selected-matching').not('.selected-differing').addClass('selected-maybe');
    }
}

class MatchedItem {
    constructor(item, identifiersAndValues) {
        this.item = item;
        this.identifiersAndValues = identifiersAndValues;
    }

    getScore() {
        if (!this.hasOwnProperty('_score')) {
            this._score = this._itemMatchScoreAll();
        }
        return this._score;
    }

    _itemMatchScore(identifier, value) {
        var score = null;

        $.each(this.item.identification, function(index, id) {
            // Not the right identifier - ignore
            if (!Object.is(identifier, id.identifier)) {
                return true;  // continue
            }

            // Correct identifier, check if the selected value matches
            // the item's values.
            score = id.optionScore(value);
            return false;
        });

        return score;
    }

    _distillScores(scores) {
        scores = this._sanitiseScores(scores);

        if (scores.length == 0) {
            return null;
        }

        var total = 0;
        var score;
        for (var i = 0; i < scores.length; i++) {
            score = scores[i];
            total += score;
        }
        return total;
    }

    _sanitiseScores(scores) {
        var saneScores = [];
        var score;
        for (var i = 0; i < scores.length; i++) {
            score = scores[i];
            if (score === null) {
                continue;
            }

            if (score > 1.0) {
                score = 1.0;
            } else if (score < -1.0) {
                score = -1.0;
            }

            saneScores.push(score);
        }
        return saneScores;
    }

    _itemMatchScoreAll() {
        var self = this;
        var scores = [];
        $.each(this.identifiersAndValues, function(index, identifierAndValue) {
            var identifier = identifierAndValue[0];
            var value = identifierAndValue[1];
            var score = self._itemMatchScore(identifier, value);
            scores.push(score);
        });
        return self._distillScores(scores);
    }
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

    getFilteredItems(identifiersAndValues) {
        var matchedItems = [];
        var self = this;

        $.each(this.items, function(index, item) {
            matchedItems.push(new MatchedItem(item, identifiersAndValues));
        });

        var filteredItems = [];
        $.each(matchedItems, function(index, item) {
            if ((item.getScore() === null) || (item.getScore() >= 0)) {
                filteredItems.push(item);
            }
        });

        // Sort by score, highest first.
        filteredItems.sort(function(a, b) {
            var scoreCmp = (b.getScore() - a.getScore());
            if (scoreCmp) {
                return scoreCmp;
            }

            if (a.item.name < b.item.name) {
                return -1;
            } else {
                return 1
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
                    $catDiv.append($('<h4/>').append($catLink));
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

    getLabel(identifier) {
        return $('<label/>')
            .attr('for', 'id_' + identifier.getSlugName())
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
            slug = identifier.getSlugName();
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

        $form.find('select').each(function() {
            var $input = $(this);
            var inputIdentifier = $input.data('identifier');

            if (!inputIdentifier.depsSatisfied(identifiersAndValues)) {
                $input.closest('.form-group').addClass('hide');
            }
        });

        $form.find('.outer').addClass('hide');
        $form.find('.form-group').not('.hide').closest('.outer').removeClass('hide');
    }

    getInput(identifier) {
        var $input = $('<select/>')
            .attr('name', identifier.getSlugName())
            .attr('id', 'id_' + identifier.getSlugName())
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
    var treeFinder = new Finder(trees);

    var formChangeCallback = function(values) {
        var filteredTrees = treeFinder.getFilteredItems(values);
        var noInputs = (values.length == 0);
        table.loadMatched(filteredTrees, !noInputs);
    }
    formChangeCallback([]);

    var $formWrapper = $('div.tree-form-wrapper');
    var finderForm = new FinderForm(treeFinder.getIdentifiers(), formChangeCallback);
    $formWrapper.html(finderForm.getElement());
});
