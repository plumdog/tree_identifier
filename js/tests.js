var id1 = new Identifier({
    name: 'id1',
    options: {
        id1a: {},
        id1b: {}
    }
});

var id2 = new Identifier({
    name: 'id2',
    options: {
        id2a: {
            point: 0.0
        },
        id2b: {
            point: 0.5
        },
        id2c: {
            point: 1.0
        }
    }
});


QUnit.test('Match beats non-match', function(assert) {
    var item1 = new Item('item1')
        .id(id1, 'id1a');
    var item2 = new Item('item2')
        .id(id1, 'id1b')

    var selected = [
        [id1, 'id1a']
    ];
    var matched1 = new MatchedItem(item1, selected);
    var matched2 = new MatchedItem(item2, selected);

    assert.ok(matched1.getScore() > matched2.getScore());
});


QUnit.test('Match beats ', function(assert) {
    var item1 = new Item('item1')
        .id(id1, 'id1a');
    var item2 = new Item('item2')
        .id(id1, 'id1b')

    var selected = [
        [id1, 'id1a']
    ];
    var matched1 = new MatchedItem(item1, selected);
    var matched2 = new MatchedItem(item2, selected);

    assert.ok(matched1.getScore() > matched2.getScore());
});


QUnit.test('Correct+nearly beats correct+nothing', function(assert) {
    var item1 = new Item('item1')
        .id(id1, 'id1a')
        .id(id2, 'id2a');
    var item2 = new Item('item2')
        .id(id1, 'id1a');

    var selected = [
        [id1, 'id1a'],
        [id2, 'id2b']
    ];
    var matched1 = new MatchedItem(item1, selected);
    var matched2 = new MatchedItem(item2, selected);

    assert.ok(matched1.getScore() > matched2.getScore());
});
