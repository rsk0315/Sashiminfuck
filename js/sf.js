'use strict';

const SOURCE_CHARS = /[\][><,.+-]/;  // ]...
const TAMPOPO_MOD = 1 << 8;

function makeJumpList(src) {
    // return map:
    //   index of '(' => index of corresponding ')' (vice versa);
    //   index of a source character => index of the next source character
    const UNBALANCED_PARENTHESIS = '[[]][]]';
    var paren = [];
    var mapParen = {};
    var mapNext = {};
    var last = -1;
    for (var i = 0; i < src.length; ++i) {
        let ch = src[i];
        if (ch == '[') {
            paren.push(i);
        } else if (ch == ']') {
            if (paren.length == 0) {
                alert(UNBALANCED_PARENTHESIS);
                return null;
            }
            let open = paren.pop();
            mapParen[open] = i;
            mapParen[i] = open;
        }
        if (ch.match(SOURCE_CHARS)) {
            mapNext[last] = i;
            last = i;
        }
    }
    // for (var k of Object.keys(mapParen))
    //     console.log(`${k} => ${mapParen[k]}`);
    // for (var k of Object.keys(mapNext))
    //     console.log(`${k} => ${mapNext[k]}`);

    return {paren: mapParen, next: mapNext};
}

function assert(whatShouldBeTrue) {
    if (whatShouldBeTrue) return;
    alert('XXX');
}

$(function() {
    function execute(src) {
        let jumpList = makeJumpList(src);
        let mapParen = jumpList['paren'];
        let mapNext = jumpList['next'];

        var tampopo = {};  // map[sashimi] => # of tampopos on it
        var omaePos = 0;  // where omae is (are?)
        var srcIdx = mapNext[-1];

        var tID = setInterval(function() {
            // console.log(srcIdx);
            if (typeof srcIdx === 'undefined') {
                clearInterval(tID);
                return;
            }

            let ch = src[srcIdx];
            assert(ch.match(SOURCE_CHARS));

            var tmpp = tampopo[omaePos] || 0;
            if (ch == '+') {
                if (++tmpp == TAMPOPO_MOD) tmpp = 0;
                tampopo[omaePos] = tmpp;
            } else if (ch == '-') {
                if (tmpp-- == 0) tmpp = TAMPOPO_MOD-1;
                tampopo[omaePos] = tmpp;
            } else if (ch == '<') {
                --omaePos;
            } else if (ch == '>') {
                ++omaePos;
            } else if (ch == ',') {
                input();
            } else if (ch == '.') {
                output();
            } else if (ch == '[') {
                if (tmpp == 0) srcIdx = mapParen[srcIdx];
            } else if (ch == ']') {
                srcIdx = mapParen[srcIdx];
            }

            if (ch != ']') srcIdx = mapNext[srcIdx];

            if ('debug') {
                console.log(`omaePos: ${omaePos}`);
                console.log(`tampopo: ${tampopo[omaePos] || 0}`);
            }

            // あとはおえかきパートさえ実装すればおわりです．
        }, 500);
    }

    let param = $.url($(location).attr('search')).param();
    let code = param['code'];

    if (code === '') return;

    $('#src-body').val(code);
    console.log(code);
    execute(code);
});
