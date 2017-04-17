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
    },
    round: function(num, places) {
        if (num === null) {
            return null;
        }
        return Number(Math.round(num + 'e' + places) + 'e-' + places);
    }
};

class IdentifierInfo {
    constructor(identifier) {
        this.identifier = identifier;
    }

    getElement() {
        var $info = null;

        if (this.identifier.help) {
            $info = $('<a/>')
                .attr('href', '#')
                .addClass('btn')
                .append(
                    $('<span/>')
                        .addClass('glyphicon glyphicon-info-sign'));
            $info.on('click', function() {
                var self = $(this);
                var inputIdentifier = self
                    .closest('.form-group')
                    .find('select')
                    .data('identifier');

                var $modalDiv = $('#modal-info');
                $modalDiv.find('.modal-title').text(inputIdentifier.name);
                var $modalBody = $modalDiv.find('.modal-body');
                $modalBody.empty()

                $modalBody
                    .append($('<p/>').text(inputIdentifier.help))
                    .append($('<h3/>').text('Options'));

                var $optionsList = $('<ul/>');
                var $optionInfo;
                var optionText;
                $.each(inputIdentifier.options, function(option, info) {
                    $optionInfo = $('<li/>');
                    optionText = inputIdentifier.optionName(option);
                    if (info.help) {
                        optionText += ' - ' + info.help;
                    }
                    $optionInfo.text(optionText);
                    $optionsList.append($optionInfo);
                });

                $modalBody.append($optionsList);

                $modalDiv.modal();
                return false;
            });
        }
        return $info;
    }
}


class Identifier {
    constructor(args) {
        var {category, name, options, depends, pointDelta, fullName, slugName, searchTermFn, help} = args;
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
        this.fullName = fullName || utils.capitalize(this.name);
        this.slugName = slugName || this.fullName.replace(new RegExp(' ', 'g'), '_').toLowerCase();
        this.searchTermFn = searchTermFn;
        this.help = help;

        this.info = new IdentifierInfo(this);
    }

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

    depsSatisfied(identifiersAndValues, forceHard) {
        forceHard = Boolean(forceHard);
        var allSatisfied = true;
        $.each(this.depends, function(index, dependency) {
            var depSatisfied = dependency.satisfied(identifiersAndValues, forceHard);

            if (!depSatisfied) {
                allSatisfied = false;
                return false;
            }

            if (!dependency.identifier.depsSatisfied(identifiersAndValues, forceHard)) {
                allSatisfied = false;
                return false;
            }
        });
        return allSatisfied;
    }

    static bool(args) {
        args.options = {
            true: {
                name: 'Yes'
            },
            false: {
                name: 'No'
            }
        };

        return new Identifier(args);
    }

    dependency(args) {
        args.identifier = this;
        return new Dependency(args);
    }
}


class Dependency {
    constructor(args) {
        var {identifier, option, hard, invert} = args;
        this.identifier = identifier;
        this.option = option;
        this.hard = Boolean(hard);
        this.invert = Boolean(invert);
    }

    satisfied(identifiersAndValues, forceHard) {
        forceHard = Boolean(forceHard) || this.hard;
        var depIdentifier = this.identifier;
        var depValue = this.option;

        var depSatisfied = null;

        $.each(identifiersAndValues, function(index2, selectedIdentifierAndValue) {
            var [selectedIdentifier, selectedValue] = selectedIdentifierAndValue;

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
            depSatisfied = !forceHard;
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
    },
    searchTermFn: function(option, item) {
        if (option === 'needles') {
            return {
                name: 'Needle images',
                termSuffix: 'needles',
                type: 'images'
            }
        } else if ((option === 'scales') || (option === 'broad')) {
            return {
                name: 'Leaf Images',
                termSuffix: 'leaves',
                type: 'images'
            }
        }
    }
});

var cones = Identifier.bool({
    category: 'Cone',
    name: 'Cone',
    depends: [
        leafType.dependency({
            option: 'needles'
        })
    ],
    searchTermFn: function(option, item) {
        if (option === true) {
            return {
                name: 'Cone images',
                termSuffix: 'cones',
                type: 'images'
            }
        }
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
        cones.dependency({
            option: true,
            hard: true
        })
    ]
    
});

var leafColour = new Identifier({
    category: 'Leaf Colour',
    name: 'Colour',
    fullName: 'Leaf colour',
    options: {
        darkGreen: {
            name: "Dark green"
        },
    },
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});
var leafColourBeneath = new Identifier({
    category: 'Leaf Colour',
    name: 'Colour underneath',
    fullName: 'Leaf colour underneath',
    options: {
        paleGreen: {
            name: "Pale green"
        },
    },
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});
var leafAppearance = new Identifier({
    category: 'Leaf Colour',
    name: 'Appearance',
    fullName: 'Leaf appearance',
    options: {
        shiny: {},
    },
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});

var needlesUndersideTwoWhiteLines = Identifier.bool({
    category: 'Leaf Colour',
    name: 'Needles underside two white lines',
    depends: [
        leafType.dependency({
            option: 'needles',
            hard: true
        })
    ]
});
var sharpWhiteBand = Identifier.bool({
    category: 'Leaf Colour',
    name: 'Sharp white band',
    depends: [
        leafType.dependency({
            option: 'needles',
            hard: true
        })
    ]
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
        leafType.dependency({
            option: 'broad',
            hard: true
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
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});

var shape = new Identifier({
    category: 'Leaf Shape',
    name: 'Overall Shape',
    fullName: 'Leaf overall shape',
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
        leafType.dependency({
            option: 'broad',
            hard: true
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
        shape.dependency({
            option: 'longThin',
            hard: true
        }),
        leafType.dependency({
            option: 'broad',
            hard: true
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
        leafType.dependency({
            option: 'broad',
            hard: true
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
        compound.dependency({
            option: 'compoundPairs',
            hard: true
        })
    ]
});

var leafletNumber = new Identifier({
    category: 'Leaf Arrangement',
    name: 'Number of pairs',
    options: {
        twoOrThree: {
            name: 'Two or three'
        },
        manyPairs: {
            name: 'Many'
        }
    },
    depends: [
        compound.dependency({
            option: 'compoundPairs',
            hard: true
        })
    ]
});

var lobed = Identifier.bool({
    category: 'Leaf Shape',
    name: 'Lobed',
    fullName: 'Leaf lobed',
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});

var leafBaseShape = new Identifier({
    category: 'Leaf Shape',
    name: 'Base shape',
    fullName: 'Leaf base shape',
    options: {
        asymmetric: {
            point: 0.0,
        },
        vShaped: {
            name: 'V-shaped',
            point: 1.5,
        },
        rounded: {
            point: 2.0,
        },
        flatAndWide: {
            name: 'Flat and wide',
            point: 2.5,
        },
        vShapedInward: {
            name: 'Inward v-shaped',
            point: 3.0,
        },
        heart: {
            name: 'Heart-shaped',
            point: 3.5,
        },
    },
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});

var lobedRibs = new Identifier({
    category: 'Leaf Shape',
    name: "Lobe ribs",
    fullName: 'Leaf lobe ribs',
    options: {
        radial: {},
        spinal: {}
    },
    depends: [
        lobed.dependency({
            option: true,
            hard: true
        })
    ]
});
var twigSideShoots = Identifier.bool({
    category: 'Twig',
    name: 'Twig side shoots',
    depends: [
        leafType.dependency({
            option: 'needles',
            hard: true
        })
    ]
});
var suckerBase = Identifier.bool({
    category: 'Leaf Stalk',
    name: 'Needle sucker base',
    depends: [
        leafType.dependency({
            option: 'needles',
            hard: true
        })
    ],
});
var pegLeftWhenRemoved = Identifier.bool({
    category: 'Leaf Stalk',
    name: 'Needle peg left when removed',
    depends: [
        leafType.dependency({
            option: 'needles',
            hard: true
        })
    ]
});
var needlesAllDirections = Identifier.bool({
    category: 'Leaf Arrangement',
    name: 'Needles all directions',
    depends: [
        leafType.dependency({
            option: 'needles',
            hard: true
        })
    ]
});
var pineappleSmell = Identifier.bool({
    category: 'Leaf Smell',
    name: 'Pineapple smell when leaves crushed',
    depends: [
        leafType.dependency({
            option: 'scales',
            hard: true
        })
    ]
});

var needlePairsThreeOrFive = Identifier.bool({
    category: 'Leaf Arrangement',
    name: 'Needle pairs - three or five',
    depends: [
        leafType.dependency({
            option: 'needles',
            hard: true
        })
    ]
});
var lobedEdgeShape = new Identifier({
    category: 'Leaf Shape',
    name: "Lobed edge shape",
    options: {
        rounded: {
            point: 0.0
        },
        blunt: {
            point: 0.5
        },
        toothed: {
            point: 1.8
        },
        thorny: {
            point: 2.0
        },
        sharp: {
            point: 2.2
        }
    },
    depends: [
        lobed.dependency({
            option: true,
            hard: true
        })
    ]
});
var barkColour = new Identifier({
    category: 'Bark',
    name: 'Colour',
    fullName: 'Bark colour',
    help: 'What colour is the bark of the main trunk of the tree?',
    // TODO: consider making this a 2D metric
    options: {
        white: {
            point: -1.5
        },
        paleGrey: {
            name: 'Pale grey',
            point: -0.5
        },
        greenGrey: {
            name: 'Green/Grey',
            point: -0.2
        },
        grey: {
            point: 0.0
        },
        pinkGrey: {
            name: 'Pink/Grey',
            point: 0.5
        },
        purpleGrey: {
            name: 'Purple/Grey',
            point: 0.8,
        },
        greyBrown: {
            name: 'Grey/Brown',
            point: 1.0
        },
        redGrey: {
            name: 'Red/Grey',
            point: 1.2
        },
        lightBrown: {
            name: 'Light brown',
            point: 1.4
        },
        pinkBrown: {
            name: 'Pink/Brown',
            point: 1.5
        },
        purpleBrown: {
            name: 'Purple/Brown',
            point: 1.8
        },
        brown: {
            name: 'Brown',
            point: 2.0
        },
        redBrown: {
            name: 'Red/Brown',
            point: 2.2
        },
        orangeBrown: {
            name: 'Orange/Brown',
            point: 2.5
        },
        darkBrown: {
            name: 'Dark brown',
            point: 2.8
        },
        blackBrown: {
            name: 'Black/Brown',
            point: 3.0
        }
    },
    searchTermFn: function(option, item) {
        return {
            name: 'Bark images',
            termSuffix: 'bark',
            type: 'images'
        }
    }
});
var lobesThreeToEight = Identifier.bool({
    category: 'Leaf Shape',
    name: 'Lobes three to eight',
    depends: [
        lobed.dependency({
            option: true,
            hard: true
        })
    ]
});

var twigsShinyDarkBrown = Identifier.bool({
    category: 'Twig',
    name: 'Twigs shiny dark brown',
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});
var whiteWoolyAbove = Identifier.bool({
    category: 'Leaf Texture',
    name: 'White wooly above',
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});
var budAtBaseShortStalk = Identifier.bool({
    category: 'Leaf Stalk',
    name: 'Bud at base short stalk',
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
})
var whiteHairsBeneath = Identifier.bool({
    category: 'Leaf Texture',
    name: 'White hairs beneath',
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});

var veryHairy = Identifier.bool({
    category: 'Leaf Texture',
    name: 'Very hairy',
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});
var smooth = Identifier.bool({
    category: 'Leaf Texture',
    name: 'Smooth',
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});
var stalkWhiteHairs = Identifier.bool({
    category: 'Leaf Stalk',
    name: 'Stalk white hairs',
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});
var softlyHairy = Identifier.bool({
    category: 'Leaf Texture',
    name: 'Softly hairy',
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});
var veins = Identifier.bool({
    category: 'Leaf Texture',
    name: 'Veins',
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
        })
    ]
});
var wavyEdge = Identifier.bool({
    category: 'Leaf Shape',
    name: 'Wavy edge',
    depends: [
        leafType.dependency({
            option: 'broad',
            hard: true
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

    toString() {
        return this.identifier.fullName + ': ' + this.identifier.optionName(this.option);
    }

    searchTerm(item) {
        if (this.identifier.searchTermFn) {
            var identifierSearchTerm = this.identifier.searchTermFn(this.option, item);
            var term = (identifierSearchTerm.term
                        || item.defaultSearchTerm + ' ' + identifierSearchTerm.termSuffix);
            if (identifierSearchTerm.name && term) {
                return {
                    name: identifierSearchTerm.name,
                    term: term,
                    type: identifierSearchTerm.type
                }
            }
        }
    }
}

class Item {
    constructor(name, extra) {
        this.name = name;
        this.identification = [];

        var {defaultSearchSuffix} = extra || {};

        this.defaultSearchSuffix = (typeof defaultSearchSuffix !== 'undefined') ? defaultSearchSuffix : 'tree'
        if (this.defaultSearchSuffix) {
            this.defaultSearchTerm = this.name + ' ' + this.defaultSearchSuffix;
        } else {
            this.defaultSearchTerm = this.name;
        }
    }

    referenceIdentifiersAndValues() {
        var identifierAndValues = [];
        $.each(this.identification, function(i, boundIdentifier) {
            identifierAndValues.push(
                [boundIdentifier.identifier, boundIdentifier.option]
            )
        });
        return identifierAndValues;
    }

    id(identifier, selectedOption) {
        // Check that if the added identifier has dependencies that
        // they are satisfied already. Note that this means that
        // identifiers must be added in dependency-aware order.

        var identifierAndValues = this.referenceIdentifiersAndValues();
        if (!identifier.depsSatisfied(identifierAndValues, true)) {
            throw 'Adding ' + identifier.name + ' to ' + this.name + ' breaks deps';
        }

        this.identification.push(new BoundIdentifier(identifier, selectedOption))
        return this;
    }

    searchTerms() {
        var searches = [];

        searches.push({
            name: 'Search',
            term: this.defaultSearchTerm,
            defaultSearch: true
        });

        var searchTerm;
        var self = this;
        $.each(this.identification, function(i, boundIdentifier) {
            searchTerm = boundIdentifier.searchTerm(self);
            if (searchTerm) {
                searches.push(searchTerm);
            }
        });

        searches.push({
            name: 'Images',
            term: this.defaultSearchTerm,
            defaultSearch: true,
            type: 'images',
            defaultSearch: true
        });

        return searches;
    }
}

var trees = [
    new Item('Juniper')
        .id(leafType, 'needles')
        .id(sharpWhiteBand, true)
        .id(barkColour, 'greyBrown'),
    new Item('Corsican Pine')
        .id(leafType, 'needles')
        .id(needlePairsThreeOrFive, true)
        .id(barkColour, 'pinkGrey'),
    new Item('Scots Pine')
        .id(leafType, 'needles')
        .id(needlePairsThreeOrFive, true)
        .id(cones, true)
        .id(barkColour, 'orangeBrown'),
    new Item('Lodgepole Pine')
        .id(leafType, 'needles')
        .id(needlePairsThreeOrFive, true)
        .id(barkColour, 'redBrown'),
    new Item('Cedar')
        .id(leafType, 'needles')
        .id(twigSideShoots, true)
        .id(cones, true)
        .id(coneShape, 'barrel')
        .id(barkColour, 'blackBrown'),
    new Item('Larch')
        .id(leafType, 'needles')
        .id(twigSideShoots, true)
        .id(cones, true)
        .id(coneShape, 'egg')
        .id(barkColour, 'greyBrown'),
    new Item('Fir')
        .id(leafType, 'needles')
        .id(twigSideShoots, false)
        .id(suckerBase, true)
        .id(barkColour, 'purpleGrey'),
    new Item('Spruce')
        .id(leafType, 'needles')
        .id(twigSideShoots, false)
        .id(suckerBase, false)
        .id(pegLeftWhenRemoved, true)
        .id(barkColour, 'purpleGrey'),
    new Item('Douglas Fir')
        .id(leafType, 'needles')
        .id(twigSideShoots, false)
        .id(suckerBase, false)
        .id(pegLeftWhenRemoved, false)
        .id(needlesAllDirections, true)
        .id(barkColour, 'purpleBrown'),
    new Item('Western Hemlock')
        .id(leafType, 'needles')
        .id(twigSideShoots, false)
        .id(suckerBase, false)
        .id(pegLeftWhenRemoved, false)
        .id(needlesAllDirections, false)
        .id(needlesUndersideTwoWhiteLines, true)
        .id(barkColour, 'darkBrown'),
    new Item('Yew')
        .id(leafType, 'needles')
        .id(twigSideShoots, false)
        .id(suckerBase, false)
        .id(cones, true)
        .id(pegLeftWhenRemoved, false)
        .id(needlesAllDirections, false)
        .id(needlesUndersideTwoWhiteLines, false)
        .id(barkColour, 'redBrown'),
    new Item('Cypress')
        .id(leafType, 'scales')
        .id(pineappleSmell, false)
        .id(barkColour, 'redGrey'),
    new Item('Western Red Cedar')
        .id(leafType, 'scales')
        .id(pineappleSmell, true)
        .id(barkColour, 'redBrown'),
    new Item('Horse Chestnut')
        .id(leafType, 'broad')
        .id(compound, 'compoundFiveEndOfStalk')
        .id(barkColour, 'pinkGrey')
        .id(leafBaseShape, 'vShaped'),
    new Item('Elder')
        .id(leafType, 'broad')
        .id(compound, 'compoundPairs')
        .id(leafletNumber, 'twoOrThree')
        .id(leafletPairsArrangement, 'symmetric')
        .id(barkColour, 'greyBrown')
        .id(leafBaseShape, 'vShaped'),
    new Item('Ash')
        .id(leafType, 'broad')
        .id(compound, 'compoundPairs')
        .id(leafletNumber, 'manyPairs')
        .id(leafletPairsArrangement, 'symmetric')
        .id(barkColour, 'grey')
        .id(shape, 'longThin')
        .id(leafBaseShape, 'vShaped'),
    new Item('Rowan')
        .id(leafType, 'broad')
        .id(compound, 'compoundPairs')
        .id(leafletNumber, 'manyPairs')
        .id(leafletPairsArrangement, 'alternate')
        .id(barkColour, 'grey')
        .id(leafBaseShape, 'rounded'),
    new Item('Sycamore')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, true)
        .id(lobedEdgeShape, 'toothed')
        .id(lobedRibs, 'radial')
        .id(leafToothed, 'medium')
        .id(barkColour, 'pinkGrey')
        .id(leafBaseShape, 'vShapedInward')
        .id(leafColour, 'darkGreen'),
    new Item('Field Maple')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, true)
        .id(lobedEdgeShape, 'blunt')
        .id(lobedRibs, 'radial')
        .id(leafToothed, 'none')
        .id(barkColour, 'lightBrown')
        .id(leafBaseShape, 'vShapedInward'),
    // idBool('symmetricPairs') true),  // ?
    new Item('London Plane')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, true)
        .id(lobedEdgeShape, 'sharp')
        .id(lobedRibs, 'radial')
        .id(leafToothed, 'none')
        .id(barkColour, 'greenGrey')
        .id(leafBaseShape, 'flatAndWide'),
    // idBool('alternatePairs') true),
    new Item('Oak')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, true)
        .id(lobedEdgeShape, 'rounded')
        .id(lobedRibs, 'spinal')
        .id(lobesThreeToEight, true)
        .id(barkColour, 'greyBrown')
        .id(leafBaseShape, 'vShaped'),
    new Item('Hawthorn')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, true)
        .id(lobedRibs, 'spinal')
        .id(lobesThreeToEight, false)
        .id(lobedEdgeShape, 'thorny')
        .id(barkColour, 'greyBrown')
        .id(leafBaseShape, 'vShaped'),
    new Item('Wild Service Tree', {defaultSearchSuffix: ''})
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, true)
        .id(lobedRibs, 'spinal')
        .id(lobesThreeToEight, false)
        .id(lobedEdgeShape, 'toothed')
        .id(barkColour, 'brown')
        .id(leafBaseShape, 'flatAndWide'),
    new Item('Willow')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'longThin')
        .id(length, 'moreThan10cm')
        .id(leafToothed, 'minute')
        .id(barkColour, 'brown')
        .id(leafBaseShape, 'vShaped'),
    new Item('Sweet Chestnut')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'longThin')
        .id(length, 'moreThan10cm')
        .id(leafToothed, 'large')
        .id(barkColour, 'purpleGrey')
        .id(leafBaseShape, 'rounded')
        .id(leafColour, 'darkGreen'),
    new Item('Hornbeam')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'longThin')
        .id(length, 'lessThan10cm')
        .id(leafToothed, 'double')
        .id(barkColour, 'grey')
        .id(leafBaseShape, 'rounded'),
    new Item('Bird Cherry')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'longThin')
        .id(length, 'lessThan10cm')
        .id(twigsShinyDarkBrown, true)
        .id(leafToothed, 'small')
        .id(barkColour, 'greyBrown')
        .id(leafBaseShape, 'vShaped'),
    new Item('Holm Oak')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(leafColour, 'darkGreen')
        .id(whiteWoolyAbove, true)
        .id(barkColour, 'blackBrown')
        .id(leafBaseShape, 'rounded'),
    //stemColour: 'grey-brown')
    //stemHairs: 'short pale-brown'
    new Item('Crab Apple')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(leafColour, 'darkGreen')
        .id(whiteWoolyAbove, true)
        .id(budAtBaseShortStalk, true)
        .id(barkColour, 'greyBrown')
        .id(leafBaseShape, 'rounded'),
    new Item('Whitebeam')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(leafColour, 'darkGreen')
        .id(leafAppearance, 'shiny')
        .id(whiteWoolyAbove, true)
        .id(whiteHairsBeneath, true)
        .id(barkColour, 'grey')
        .id(leafBaseShape, 'rounded'),
    new Item('Lime')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(leafTipShape, 'abrupt')
        .id(leafBaseShape, 'heart')
        .id(leafColour, 'darkGreen')
        .id(leafColourBeneath, 'paleGreen')
        .id(barkColour, 'greyBrown'),
    new Item('Hazel')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'small')
        .id(leafTipShape, 'abrupt')
        .id(veryHairy, true)
        .id(barkColour, 'greyBrown')
        .id(leafBaseShape, 'vShapedInward'),
    new Item('Poplar')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(leafTipShape, 'abrupt')
        .id(smooth, true)
        .id(barkColour, 'paleGrey')
        .id(leafBaseShape, 'flatAndWide'),
    new Item('Silver Birch')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(leafTipShape, 'tapered')
        .id(barkColour, 'white')
        .id(leafBaseShape, 'flatAndWide'),
    new Item('Downy Birch')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(leafTipShape, 'tapered')
        .id(stalkWhiteHairs, true)
        .id(barkColour, 'paleGrey')
        .id(leafBaseShape, 'vShaped'),
    new Item('Elm')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'medium')
        .id(leafBaseShape, 'asymmetric')
        .id(barkColour, 'greyBrown'),
    new Item('Common Alder')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'none')
        .id(leafTipShape, 'blunt')
        .id(leafColour, 'darkGreen')
        .id(barkColour, 'darkBrown')
        .id(leafBaseShape, 'rounded'),
    new Item('Goat Willow')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'none')
        .id(softlyHairy, true)
        .id(veins, true)
        .id(barkColour, 'greyBrown')
        .id(leafBaseShape, 'vShaped'),
    new Item('Beech')
        .id(leafType, 'broad')
        .id(compound, 'simple')
        .id(lobed, false)
        .id(shape, 'round')
        .id(leafToothed, 'none')
        .id(leafAppearance, 'shiny')
        .id(wavyEdge, true)
        .id(barkColour, 'grey')
        .id(leafBaseShape, 'vShaped')
];


class TreeTable {
    constructor($table) {
        this.$table = $table;
        this.identifiers = [];
    }

    reset() {
        this.$table.find('.tree-table-body').empty();
    }

    loadMatched(matchedRows, includeScores) {
        if (typeof(includeScores) == 'undefined') {
            includeScores = true;
        }

        var self = this;
        this.reset();
        $.each(matchedRows, function(index, row) {
            self.addRow(row, includeScores);
        });
    }

    searchLinkElement(searchConfig) {
        var url = 'https://www.google.com/search?'
        if (searchConfig.type === 'images') {
            url += 'tbm=isch&';
        }
        url += 'q=' + searchConfig.term;

        return $('<a/>')
            .attr('href', url)
            .addClass('item-search btn btn-default')
            .attr('target', '_blank')
            .text(searchConfig.name);
    }

    searchLinks(item) {
        var $imageLinks = $();
        var self = this;
        $.each(item.searchTerms(), function(i, searchConfig) {
            var $link = self.searchLinkElement(searchConfig);

            if (!searchConfig.defaultSearch) {
                $link.addClass('hidden-xs not-default-search')
            } else {
                $link.addClass('default-search')
            }

            $imageLinks = $imageLinks.add($link);
        });
        return $imageLinks;
    }

    addRow(row, includeScores) {
        includeScores = Boolean(includeScores);

        var item = row.item;
        var score = row.getScore();

        var $rowDiv = $('<div/>').addClass('panel panel-default');
        var $imageLinks = this.searchLinks(item);

        var $imageLinksDiv = $('<div/>')
            .addClass('btn-group')
            .attr('role', 'group')
            .append($imageLinks);

        var $species = $('<div/>')
            .addClass('panel-heading')
            .append($('<h5/>')
                    .attr('style', 'float: left')
                    .text('Species: ' + item.name))
            .append($('<div/>')
                    .attr('style', 'float: right')
                    .addClass('btn-toolbar')
                    .append($imageLinksDiv))
            .append($('<div/>').attr('style', 'clear: both'));

        var $identificationList = $('<ul>').addClass('identification list-group');
        $.each(item.identification, function(index, value) {
            $identificationList.append(
                $('<li>')
                    .addClass('list-group-item identifier identifier-' + value.identifier.slugName)
                    .text(value.toString())
            );
        });

        $rowDiv.append($species);
        $rowDiv.append($identificationList);
        $identificationList.data('identification', item.identification);

        if (includeScores) {
            var $score = $('<div/>')
                .addClass('panel-footer')
                .text('Score: ' + utils.round(score, 2));
            $rowDiv.append($score);
        }

        var self = this;

        $imageLinks.on('click', function(event) {
            event.stopPropagation();
        });

        $rowDiv.on('click', function() {
            $rowDiv.toggleClass('panel-primary');

            var $selected = self.$table.find('div.panel-primary');
            if ($selected.length > 2) {
                $selected.not($rowDiv).removeClass('panel-primary');
            }

            if ($rowDiv.hasClass('panel-primary')) {
                $rowDiv.find('.not-default-search.hidden-xs').removeClass('hidden-xs');
            } else {
                $rowDiv.find('.not-default-search').addClass('hidden-xs');
            }

            $selected = self.$table.find('div.panel-primary');
            if ($selected.length == 2) {
                self.highlightDiff(
                    $($selected[0]),
                    $($selected[1])
                )
            } else {
                self.clearDiff();
            }

            return false;
        });

        this.$table.find('.tree-table-body').append($rowDiv);
    }

    clearDiff() {
        this.$table.find('.identifier').removeClass('list-group-item-success list-group-item-warning list-group-item-danger');
    }

    highlightDiff($rowDiv1, $rowDiv2) {
        var identification1 = $rowDiv1.find('.identification').data('identification');
        var identification2 = $rowDiv2.find('.identification').data('identification');

        var matchingSlugs = [];
        var differingSlugs = [];
        var slug;
        $.each(identification1, function(i, boundIdentifier1) {
            $.each(identification2, function(j, boundIdentifier2) {
                if (Object.is(boundIdentifier1.identifier, boundIdentifier2.identifier)) {
                    slug = boundIdentifier1.identifier.slugName;
                    if (boundIdentifier1.option === boundIdentifier2.option) {
                        matchingSlugs.push(slug);
                    } else {
                        differingSlugs.push(slug);
                    }
                }
            });
        });

        $.each(matchingSlugs, function(i, slug) {
            $rowDiv1.find('.identifier-' + slug).addClass('list-group-item-success');
            $rowDiv2.find('.identifier-' + slug).addClass('list-group-item-success');
        });

        $.each(differingSlugs, function(i, slug) {
            $rowDiv1.find('.identifier-' + slug).addClass('list-group-item-danger');
            $rowDiv2.find('.identifier-' + slug).addClass('list-group-item-danger');
        });
        $rowDiv1.find('.identifier').not('.list-group-item-success').not('.list-group-item-danger').addClass('list-group-item-warning');
        $rowDiv2.find('.identifier').not('.list-group-item-success').not('.list-group-item-danger').addClass('list-group-item-warning');
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
            var [identifier, value] = identifierAndValue;
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
        var key;
        $.each(this.items, function(index, item) {
            $.each(item.identification, function(idIndex, boundIdentifier) {
                key = boundIdentifier.identifier.slugName;
                if (!found.hasOwnProperty(key)) {
                    found[key] = boundIdentifier.identifier;
                } else {
                    if (!Object.is(found[key], boundIdentifier.identifier)) {
                        // The key already exists but is different identifier.
                        throw "Duplicate for slug " + key;
                    }
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
        if (identifiersAndValues.length === 0) {
            filteredItems = matchedItems;
        } else {
            $.each(matchedItems, function(index, item) {
                if ((item.getScore() !== null) && (item.getScore() >= 0)) {
                    filteredItems.push(item);
                }
            });
        }

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
        this.inputs = [];
        this.buildElement();
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

    buildElement() {
        var $form = $('<form/>');
        var self = this;
        var $input;
        utils.objEachSorted(
            this.getCategorisedIdentifiers(),
            function(category, identifiers) {
                var $rowsDiv = $('<div/>');
                utils.arrEachSorted(
                    identifiers,
                    function(index, identifier) {
                        var $row = $('<div/>').addClass('form-group row');
                        $row.append(self.getLabel(identifier));
                        var $input = self.getInput(identifier);
                        var $info = identifier.info.getElement();

                        $row.append($('<div/>').addClass('col-xs-5').append($input));

                        if ($info) {
                            $row.append($('<div/>').addClass('col-xs-1').append($info));
                        }

                        self.inputs.push($input);
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
        this.$form = $form;
        this.hideFields([]);
    };

    getLabel(identifier) {
        return $('<label/>')
            .attr('for', 'id_' + identifier.slugName)
            .addClass('col-xs-4 col-form-label')
            .text(identifier.name);
    };

    onChange($inputElement) {
        var formValues = {};
        var $input;

        this.$form.find('select').each(function() {
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
            slug = identifier.slugName;
            value = formValues[slug];
            if (value !== undefined) {
                values.push([identifier, formValues[slug]]);
            }
        });

        this.callback(values);

        this.hideFields(values);
    }

    hideFields(identifiersAndValues) {
        this.$form.find('.form-group').removeClass('hide');
        var self = this;

        this.$form.find('select').each(function() {
            var $input = $(this);
            var inputIdentifier = $input.data('identifier');

            if (!inputIdentifier.depsSatisfied(identifiersAndValues)) {
                $input.closest('.form-group').addClass('hide');
            }
        });

        this.$form.find('.outer').addClass('hide');
        this.$form.find('.form-group').not('.hide').closest('.outer').removeClass('hide');
    }

    getInput(identifier) {
        var $input = $('<select/>')
            .attr('name', identifier.slugName)
            .attr('id', 'id_' + identifier.slugName)
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
    }

    reset() {
        $.each(this.inputs, function(i, $input) {
            $input.val('');
        });
        this.hideFields([]);
        this.$form.find('.inner').addClass('hide');
    }
}

$(document).ready(function() {
    if ($('body.main').length === 0) {
        return;
    }

    var $table = $('.tree-table');
    var table = new TreeTable($table);
    var treeFinder = new Finder(trees);
    var $reset = $('.reset');

    var formChangeCallback = function(values) {
        var filteredTrees = treeFinder.getFilteredItems(values);
        var noInputs = (values.length == 0);
        table.loadMatched(filteredTrees, !noInputs);
        $reset.toggleClass('hide', noInputs);
    }
    formChangeCallback([]);

    var $formWrapper = $('div.tree-form-wrapper');
    var finderForm = new FinderForm(treeFinder.getIdentifiers(), formChangeCallback);

    $reset.on('click', function() {
        finderForm.reset();
        formChangeCallback([]);
    });

    $formWrapper.html(finderForm.$form);
});
