'use strict';

const SOURCE_CHARS = /[\][><,.+-]/;  // ]...
const TAMPOPO_MOD = 1 << 8;
const SAMPLE_CODE = (
    '++++++++[>+++++++++<-]>.'          // H
        + '<++++[>+++++++<-]>+.'        // e
        + '+++++++..+++.'               // llo
        + '>++++[>+++++++++++<-]>.'     // ,
        + '------------.'               // <Space>
        + '<<+++++.'                    // t
        + '<+++[>------<-]>-.'          // a
        + '++++++++++++.'               // m
        + '+++.-.+.-.'                  // popo
        + '>>+.'                        // !
        + '<++++++++++.'                // <Enter>
);

let debug = false;

function makeJumpList(src) {
    // return map:
    //   index of '(' => index of corresponding ')' (vice versa);
    //   index of a source character => index of the next source character
    const UNBALANCED_PARENTHESIS = (
        '括弧の対応が取れていない．お前は絶望的にタンポポ乗せる言語に向いてないから諦めて普通のプログラミング言語でもやってろ．'
    );
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
                $('#stderr').val(UNBALANCED_PARENTHESIS);
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
    if (paren.length > 0) {
        $('#stderr').val(UNBALANCED_PARENTHESIS);
        return null;
    }
    // for (var k of Object.keys(mapParen))
    //     console.log(`${k} => ${mapParen[k]}`);
    // for (var k of Object.keys(mapNext))
    //     console.log(`${k} => ${mapNext[k]}`);

    return {paren: mapParen, next: mapNext};
}

function assert(whatShouldBeTrue) {
    if (whatShouldBeTrue) return;
    $('#stderr').val('内部エラーの可能性があります．私は絶望的にプログラミングに向いてないので諦めて刺身にタンポポ乗せる仕事でもやります．');
}

$(function() {
    var tampopo = {};  // map[sashimi] => # of tampopos on it
    var omaePos = 0;  // where omae is (are?)
    var stdin = '';
    var stdout = '';
    var inIdx = 0;
    var steps = 0;
    var tID;

    const SASHIMI_LIST = [
        'aji',
        'buri',
        'hamachi',
        'ika',
        'kanpachi',
        'maguro_akami',
        'maguro_chutoro',
        'salmon',
        'tai',
        'tako',
    ];
    const SASHIMI_WIDTH = 128;  // px
    const OMAE_WIDTH = 128;  // px
    const TAMPOPO_Y = [
        7, 8, 6, 9, 5, 10, 4, 11, 3, 12, 2, 13, 1, 14, 0, 15
    ];

    function createOmae() {
        assert($('#omae').length == 0);

        let $omae = $('<img id="omae">').attr({
            src: 'img/cleanroom_jugyouin.png',
        }).css({
            position: 'absolute',
            left: ($(window).width()-OMAE_WIDTH) / 2,
            top: '104px',
            width: OMAE_WIDTH,
        });
        $('#vis').html($omae);
    }

    function putSashimi(pos, leftpx) {
        let sLength = SASHIMI_LIST.length;
        let sI = (pos % sLength + sLength) % sLength;
        let $sashimi = $('<img class="sashimi">').attr({
            src: `img/sashimi_${SASHIMI_LIST[sI]}.png`,
        }).css({
            position: 'absolute',
            left: `${leftpx}px`,
            top: '240px',
            width: SASHIMI_WIDTH,
        });
        $('#vis').append($sashimi);

        let tmpp = tampopo[pos] || 0;
        if (tmpp == 0) return;

        var ll = leftpx+48;
        var tt = 272;
        while (tmpp >= 32) {
            let $tampopo = $('<img class="tampopo">').attr({
                src: 'img/tampopo_single.png',
            }).css({
                position: 'absolute',
                left: `${ll-12}px`,
                top: `${tt-12}px`,
                width: 48,
            });
            $('#vis').append($tampopo);
            tmpp -= 32;
            tt -= 6;
        }
        for (var i = 0; i < tmpp; ++i) {
            let $tampopo = $('<img class="tampopo">').attr({
                src: 'img/tampopo_single.png',
            }).css({
                position: 'absolute',
                left: `${ll}px`,
                top: `${tt-3*(i%64)}px`,
                width: 24,
            });
            $('#vis').append($tampopo);
        }
    }

    function reloadSashimi() {
        $('.sashimi, .tampopo').remove();

        let sWidth = SASHIMI_WIDTH
        for (var i = 1; true; ++i) {
            let leftpx = ($(window).width() - sWidth) / 2 + i * (sWidth*1.2);
            if (!(leftpx < $(window).width())) break;
            putSashimi(omaePos+i, leftpx);
        }
        for (var i = 0; true; --i) {
            let leftpx = ($(window).width() - sWidth) / 2 + i * (sWidth*1.2);
            if (!(leftpx + sWidth >= 0)) break;
            putSashimi(omaePos+i, leftpx);
        }
    }

    $(window).on('resize', function() {
        $('#omae').css({
            left: $(window).width()/2-64,
        });
        reloadSashimi(omaePos);
    });

    $('#btn-stop').on('click', function(ev) {
        ev.preventDefault();
        stop();
    });

    $('#btn-sample').on('click', function(ev) {
        ev.preventDefault();
        $('#src-body').val(SAMPLE_CODE);
    });

    $('#btn-reset').on('click', function(ev) {
        ev.preventDefault();
        location.href = './';
    });

    function input() {
        let ch = stdin.charCodeAt(inIdx++);
        if (isNaN(ch)) ch = -1;  // EOF
        tampopo[omaePos] = ch;
    }

    function output() {
        let ch = String.fromCharCode(tampopo[omaePos] || 0);
        stdout += ch;
        $('#stdout').val(stdout);
    }

    function stop() {
        if (typeof tID !== 'undefined') clearInterval(tID);
        $('#stdin, #src-body').prop('disabled', false);
        if (steps) $('#stderr').val(`実行ステップ数: ${steps}`);        
    }
                
    function execute(src) {
        let jumpList = makeJumpList(src);
        if (jumpList === null) {
            stop();
            return;
        }
        let mapParen = jumpList['paren'];
        let mapNext = jumpList['next'];

        var srcIdx = mapNext[-1];
        steps = 0;

        tID = setInterval(function() {
            // console.log(srcIdx);
            if (typeof srcIdx === 'undefined') {
                stop();
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

            ++steps;
            if (ch != ']') srcIdx = mapNext[srcIdx];

            if (debug) {
                console.log(`omaePos: ${omaePos}`);
                console.log(`tampopo: ${tampopo[omaePos] || 0}`);
            }

            reloadSashimi(omaePos);
        }, 250);
    }

    let param = $.url($(location).attr('search')).param();
    let code = param['code'];

    createOmae();
    reloadSashimi(omaePos);

    // console.log(code);
    if (code === '' || typeof code === 'undefined') {
        return;
    }

    $('#src-body').val(code);
    $('#stdin, #src-body').prop('disabled', true);  // lock
    $('#stdout, #stderr').val('');
    stdin = unescape(encodeURIComponent($('#stdin').val()));  // UTF-8
    execute(code);
});
