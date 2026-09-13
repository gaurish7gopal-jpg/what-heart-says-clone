/* ─────────────────────────────────────────────────────────────
   Heartsays · Shared CSS-art builders (cakes + characters)
   Ported from the "Birthday Cakes & Friends" design.
   Pure HTML-string builders so the SAME art renders in the React
   creation flow (via src/lib/cardArt.ts, a mirror of this file)
   and inside the static card iframe (window.HeartArt).

   Required keyframes (defined in card-interactive.html and
   globals.css): whs-flame, whs-twk, whs-bob, whs-blink, whs-pop,
   whs-wiggle, whs-bounce2.
   ───────────────────────────────────────────────────────────── */
(function (root) {
  function camel(p) { return p.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); }); }
  function css(style) {
    var out = "";
    for (var k in style) {
      if (style[k] == null) continue;
      out += camel(k) + ":" + style[k] + ";";
    }
    return out;
  }
  // el(style, inner) → div string. inner may be string or array of strings.
  function el(style, inner) {
    if (Array.isArray(inner)) inner = inner.join("");
    return '<div style="' + css(style) + '">' + (inner || "") + "</div>";
  }

  /* ═══════════════ CAKES ═══════════════ */
  // Cake art lives in a 170 × 185 box, content anchored to the bottom.
  // Candles are tagged with whs-flame-el / whs-smoke-el so the card engine
  // can find and blow them out.
  function candleTagged(left, c, key) {
    var stick = el({
      position: "absolute", bottom: "118px", left: left + "px", width: "8px", height: "34px",
      borderRadius: "3px", zIndex: 6,
      background: "repeating-linear-gradient(45deg, " + c + " 0 5px, rgba(255,255,255,0.55) 5px 10px)"
    }, el({ position: "absolute", top: "-6px", left: "3px", width: "2px", height: "6px", background: "#6b4a2a" }));
    var flame = '<div class="whs-flame-el" style="' + css({
      position: "absolute", bottom: "150px", left: (left + 4) + "px", width: "9px", height: "18px",
      borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%",
      background: "radial-gradient(circle at 50% 78%, #fff6c4, #ffc24d 52%, #ff7a1a)",
      boxShadow: "0 0 18px 4px rgba(255,150,40,0.6)",
      transform: "translateX(-50%)", transformOrigin: "bottom center", zIndex: 7,
      animation: "whs-flame 1.5s ease-in-out infinite"
    }) + '"></div>';
    var smoke = '<div class="whs-smoke-el" style="' + css({
      position: "absolute", bottom: "152px", left: (left + 4) + "px", width: "6px", height: "6px",
      borderRadius: "50%", background: "rgba(200,200,200,0.45)", opacity: "0",
      transform: "translateX(-50%)", zIndex: 7
    }) + '"></div>';
    return stick + flame + smoke;
  }

  var plate = el({
    position: "absolute", bottom: "2px", left: "50%", transform: "translateX(-50%)", width: "162px",
    height: "16px", borderRadius: "50%", background: "linear-gradient(#fff,#e7d4df)",
    boxShadow: "0 9px 18px rgba(50,8,34,0.3)"
  });

  function frosting(bottom, left, width, color, blobs, blobSize) {
    var inner = [];
    for (var i = 0; i < blobs; i++) {
      inner.push(el({ width: blobSize + "px", height: blobSize + "px", borderRadius: "0 0 50% 50%", background: color }));
    }
    return el({
      position: "absolute", bottom: bottom + "px", left: left + "px", width: width + "px", height: "16px",
      background: color, borderRadius: "8px 8px 4px 4px", zIndex: 4
    }, el({
      position: "absolute", top: "11px", left: "0", width: "100%", height: blobSize + "px",
      display: "flex", justifyContent: "space-between"
    }, inner));
  }
  function sprinkle(l, b, rot, c) {
    return el({ position: "absolute", left: l + "px", bottom: b + "px", width: "8px", height: "3px", borderRadius: "2px", background: c, transform: "rotate(" + rot + "deg)", zIndex: 5 });
  }
  function cherry(l, b) {
    return el({ position: "absolute", left: l + "px", bottom: b + "px", width: "13px", height: "13px", borderRadius: "50%", zIndex: 6, background: "radial-gradient(circle at 35% 30%, #ff7a8f, #d11f3c)" },
      el({ position: "absolute", top: "-7px", left: "6px", width: "2px", height: "8px", background: "#5a7a2a", transform: "rotate(12deg)" }));
  }
  function strawberry(l, b, leaf) {
    return el({ position: "absolute", left: l + "px", bottom: b + "px", width: "13px", height: "15px", borderRadius: "40% 40% 50% 50% / 35% 35% 65% 65%", background: "radial-gradient(circle at 40% 30%, #ff5e7a, #d11f3c)", zIndex: 6 },
      leaf ? el({ position: "absolute", top: "-5px", left: "3px", width: "7px", height: "6px", background: "#3da35a", clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }) : "");
  }
  function dot(l, b) {
    return el({ position: "absolute", left: l + "px", bottom: b + "px", width: "10px", height: "10px", borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #ff7a8f, #d11f3c)", zIndex: 5 });
  }

  function makeCake(o, count) {
    count = count || 3;
    var parts = [plate];
    // bottom tier
    parts.push(el({ position: "absolute", bottom: "14px", left: "18px", width: "134px", height: "60px", borderRadius: "10px 10px 16px 16px", background: o.tierA, boxShadow: "inset 0 -10px 16px rgba(0,0,0,0.12), inset 0 8px 10px rgba(255,255,255,0.25)", zIndex: 2 }, o.tierADecor || ""));
    parts.push(frosting(66, 22, 126, o.frost, 7, 11));
    // top tier
    parts.push(el({ position: "absolute", bottom: "78px", left: "44px", width: "82px", height: "40px", borderRadius: "8px 8px 12px 12px", background: o.tierB, boxShadow: "inset 0 -8px 12px rgba(0,0,0,0.12), inset 0 6px 8px rgba(255,255,255,0.25)", zIndex: 3 }, o.tierBDecor || ""));
    parts.push(frosting(112, 47, 76, o.frost, 5, 8));
    if (o.tops) parts = parts.concat(o.tops);
    // candles
    var spread = Math.min(count, 5);
    var startX = 85 - (spread - 1) * 7.5;
    for (var c = 0; c < spread; c++) {
      parts.push(candleTagged(startX + c * 15 - 4, o.candle, c));
    }
    return el({ position: "relative", width: "170px", height: "185px" }, parts);
  }

  var CAKES = [
    { key: "vanilla", name: "Classic Vanilla", desc: "Ivory sponge, soft pink piping, a cherry on top.",
      spec: { tierA: "linear-gradient(#fff7ef,#ffe6cf)", tierB: "linear-gradient(#fffaf3,#ffeede)", frost: "#ffd9e6", candle: "#ff7ab8", tops: [cherry(78, 120)] } },
    { key: "chocolate", name: "Chocolate Drip", desc: "Rich cocoa layers under a glossy ganache drip.",
      spec: { tierA: "linear-gradient(#5b3320,#3f2114)", tierB: "linear-gradient(#6a3c25,#4a2716)", frost: "#3a1f12", candle: "#ffcf5a", tops: [cherry(78, 120)] } },
    { key: "funfetti", name: "Funfetti", desc: "White frosting packed with rainbow sprinkles.",
      spec: { tierA: "linear-gradient(#fff,#ffeaf3)", tierB: "linear-gradient(#fff,#fff2f8)", frost: "#fff4fa", candle: "#7ab8ff",
        tierADecor: [sprinkle(22, 22, 30, "#ff6b9d"), sprinkle(48, 38, -20, "#5ac8fa"), sprinkle(80, 26, 50, "#ffd23f"), sprinkle(104, 44, -35, "#5ed47a"), sprinkle(40, 50, 15, "#b47cff"), sprinkle(96, 18, 70, "#ff8a3d")].join(""),
        tops: [sprinkle(60, 122, 20, "#ff6b9d"), sprinkle(78, 126, -30, "#5ac8fa"), sprinkle(96, 122, 60, "#ffd23f")] } },
    { key: "strawberry", name: "Strawberry", desc: "Blush cream finished with fresh strawberries.",
      spec: { tierA: "linear-gradient(#ffdfe9,#ffb9cf)", tierB: "linear-gradient(#ffe9f0,#ffc8db)", frost: "#fff0f5", candle: "#e84d6f",
        tops: [strawberry(70, 118, true), strawberry(90, 120, false)] } },
    { key: "rainbow", name: "Rainbow", desc: "Six bright layers under clean white frosting.",
      spec: { tierA: "linear-gradient(#ff6b6b 0 16.6%, #ffa94d 16.6% 33.3%, #ffe066 33.3% 50%, #69db7c 50% 66.6%, #4dabf7 66.6% 83.3%, #b197fc 83.3% 100%)",
        tierB: "linear-gradient(#ff8787 0 25%, #ffd43b 25% 50%, #69db7c 50% 75%, #4dabf7 75% 100%)", frost: "#fff", candle: "#ff7ab8", tops: [cherry(78, 120)] } },
    { key: "blackforest", name: "Black Forest", desc: "Dark sponge, whipped cream swirls, cherries.",
      spec: { tierA: "linear-gradient(#3a241c,#241410)", tierB: "linear-gradient(#fff,#f3e7ec)", frost: "#fffafc", candle: "#d11f3c",
        tops: [cherry(64, 118), cherry(82, 122), cherry(100, 118), dot(34, 70), dot(120, 60)] } },
  ];
  var CAKE_INDEX = {};
  CAKES.forEach(function (c, i) { CAKE_INDEX[c.key] = i; });

  function cakeHTML(key, count) {
    var c = CAKES[CAKE_INDEX[key] != null ? CAKE_INDEX[key] : 0];
    return makeCake(c.spec, count);
  }

  /* ═══════════════ CHARACTERS ═══════════════ */
  // Cute animated blob in a 120 × 120 circle. Ported from the design char().
  function character(o, idx) {
    var i = idx || 0;
    var W = 120;
    var parts = [];
    var body = o.tint || "#fffdf7";
    var line = o.line || "#ecd2bb";
    var cheekC = o.cheek || "rgba(255,148,148,0.85)";
    var hc = o.hair;
    var hs = o.hairShade || o.hair;

    parts.push(el({ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", width: "74px", height: "14px", borderRadius: "50%", background: "rgba(70,20,50,0.13)", filter: "blur(3px)", zIndex: 0 }));
    parts.push(el({ position: "absolute", bottom: "30px", left: "7px", width: "26px", height: "17px", borderRadius: "50%", background: body, boxShadow: "inset 0 0 0 2.5px " + line, transformOrigin: "bottom right", transform: "rotate(22deg)", zIndex: 2, animation: "whs-wiggle 2.2s ease-in-out " + (i * 0.3).toFixed(2) + "s infinite" }));
    parts.push(el({ position: "absolute", bottom: "16px", right: "11px", width: "24px", height: "16px", borderRadius: "50%", background: body, boxShadow: "inset 0 0 0 2.5px " + line, transform: "rotate(-14deg)", zIndex: 2 }));
    parts.push(el({ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", width: "90px", height: "96px", borderRadius: "50% 50% 47% 47%", background: body, boxShadow: "inset -7px -9px 16px rgba(0,0,0,0.04), inset 0 0 0 2.5px " + line, zIndex: 3 }));

    // HAIR
    if (o.hairStyle === "short") {
      parts.push(el({ position: "absolute", top: "3px", left: "50%", transform: "translateX(-50%)", width: "90px", height: "44px", borderRadius: "50% 50% 42% 42%", background: hc, zIndex: 4 }, [
        el({ position: "absolute", bottom: "-5px", left: "9px", width: "16px", height: "15px", borderRadius: "0 0 60% 50%", background: hc }),
        el({ position: "absolute", bottom: "-5px", right: "9px", width: "16px", height: "15px", borderRadius: "0 0 50% 60%", background: hc }),
        el({ position: "absolute", bottom: "-3px", left: "50%", transform: "translateX(-50%)", width: "14px", height: "10px", borderRadius: "0 0 50% 50%", background: hc }),
      ]));
    } else if (o.hairStyle === "bob") {
      parts.push(el({ position: "absolute", top: "3px", left: "50%", transform: "translateX(-50%)", width: "106px", height: "84px", borderRadius: "50% 50% 46% 46%", background: hs, zIndex: 1 }));
      parts.push(el({ position: "absolute", top: "3px", left: "50%", transform: "translateX(-50%)", width: "95px", height: "42px", borderRadius: "50% 50% 38% 38%", background: hc, zIndex: 4 }));
      parts.push(el({ position: "absolute", top: "30px", left: "6px", width: "17px", height: "52px", borderRadius: "45% 45% 55% 55%", background: hc, zIndex: 4 }));
      parts.push(el({ position: "absolute", top: "30px", right: "6px", width: "17px", height: "52px", borderRadius: "45% 45% 55% 55%", background: hc, zIndex: 4 }));
    } else if (o.hairStyle === "bun") {
      parts.push(el({ position: "absolute", top: "5px", left: "50%", transform: "translateX(-50%)", width: "93px", height: "40px", borderRadius: "50% 50% 44% 44%", background: hc, zIndex: 4 }));
      parts.push(el({ position: "absolute", top: "26px", left: "8px", width: "12px", height: "32px", borderRadius: "50%", background: hc, zIndex: 4 }));
      parts.push(el({ position: "absolute", top: "26px", right: "8px", width: "12px", height: "32px", borderRadius: "50%", background: hc, zIndex: 4 }));
      parts.push(el({ position: "absolute", top: "-7px", left: "50%", transform: "translateX(-50%)", width: "30px", height: "30px", borderRadius: "50%", background: hc, zIndex: 6 },
        el({ position: "absolute", top: "6px", left: "7px", width: "9px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.18)" })));
    } else if (o.hairStyle === "curly") {
      parts.push(el({ position: "absolute", top: "1px", left: "50%", transform: "translateX(-50%)", width: "106px", height: "70px", borderRadius: "50%", background: hs, zIndex: 1 }));
      [[16, 2, 27], [38, -6, 31], [62, -6, 31], [85, 2, 27], [7, 25, 23], [95, 25, 23]].forEach(function (c) {
        parts.push(el({ position: "absolute", top: c[1] + "px", left: c[0] + "px", width: c[2] + "px", height: c[2] + "px", borderRadius: "50%", background: hc, zIndex: 4 }));
      });
    } else if (o.hairStyle === "neutral") {
      parts.push(el({ position: "absolute", top: "2px", left: "50%", transform: "translateX(-50%)", width: "100px", height: "64px", borderRadius: "50% 50% 46% 46%", background: hs, zIndex: 1 }));
      parts.push(el({ position: "absolute", top: "2px", left: "50%", transform: "translateX(-50%)", width: "95px", height: "46px", borderRadius: "50% 50% 36% 36%", background: hc, zIndex: 4 }, [
        el({ position: "absolute", bottom: "-5px", left: "11px", width: "21px", height: "14px", borderRadius: "0 0 55% 45%", background: hc }),
        el({ position: "absolute", bottom: "-6px", left: "50%", transform: "translateX(-50%)", width: "23px", height: "15px", borderRadius: "0 0 50% 50%", background: hc }),
        el({ position: "absolute", bottom: "-5px", right: "11px", width: "21px", height: "14px", borderRadius: "0 0 45% 55%", background: hc }),
      ]));
      parts.push(el({ position: "absolute", top: "30px", left: "7px", width: "15px", height: "30px", borderRadius: "45% 45% 55% 55%", background: hc, zIndex: 4 }));
      parts.push(el({ position: "absolute", top: "30px", right: "7px", width: "15px", height: "30px", borderRadius: "45% 45% 55% 55%", background: hc, zIndex: 4 }));
    }

    // EYES (blinking) — dot eyes or wink
    function eye(side) {
      return el({ position: "absolute", top: "52px", [side]: "30px", width: "11px", height: "14px", borderRadius: "50%", background: "#4a3530", zIndex: 7 },
        el({ position: "absolute", top: "2px", right: "2px", width: "4px", height: "4px", borderRadius: "50%", background: "#fff" }));
    }
    var eyesInner;
    if (o.expr === "wink") {
      eyesInner = el({ position: "absolute", top: "54px", left: "30px", width: "13px", height: "8px", borderRadius: "0 0 12px 12px", border: "3px solid #4a3530", borderTop: "none", zIndex: 7 }) + eye("right");
    } else {
      eyesInner = eye("left") + eye("right");
    }
    parts.push(el({ position: "absolute", inset: "0", zIndex: 7, transformOrigin: "50% 58%", animation: "whs-blink 4.4s ease-in-out " + (i * 0.6).toFixed(2) + "s infinite" }, eyesInner));

    // cheeks
    function cheek(side) {
      return el({ position: "absolute", top: "60px", [side]: "17px", width: "18px", height: "12px", borderRadius: "50%", background: cheekC, zIndex: 6 },
        el({ position: "absolute", top: "2px", left: "4px", width: "5px", height: "4px", borderRadius: "50%", background: "rgba(255,255,255,0.55)" }));
    }
    parts.push(cheek("left"));
    parts.push(cheek("right"));

    // mouth
    if (o.expr === "heart") {
      parts.push(el({ position: "absolute", top: "66px", left: "50%", transform: "translateX(-50%)", width: "22px", height: "19px", zIndex: 7 }, [
        el({ position: "absolute", left: "0", top: "0", width: "13px", height: "13px", borderRadius: "50%", background: "#ff7a6b" }),
        el({ position: "absolute", right: "0", top: "0", width: "13px", height: "13px", borderRadius: "50%", background: "#ff7a6b" }),
        el({ position: "absolute", left: "50%", top: "5px", transform: "translateX(-50%) rotate(45deg)", width: "15px", height: "15px", borderRadius: "3px", background: "#ff7a6b" }),
        el({ position: "absolute", left: "50%", top: "9px", transform: "translateX(-50%)", width: "9px", height: "7px", borderRadius: "50%", background: "#ff5470" }),
      ]));
    } else if (o.expr === "grin") {
      parts.push(el({ position: "absolute", top: "68px", left: "50%", transform: "translateX(-50%)", width: "20px", height: "12px", borderRadius: "5px 5px 12px 12px", background: "#d8526b", overflow: "hidden", zIndex: 7 },
        el({ position: "absolute", bottom: "0", left: "50%", transform: "translateX(-50%)", width: "11px", height: "5px", background: "#ff8aa0", borderRadius: "6px 6px 3px 3px" })));
    } else if (o.expr === "wink") {
      parts.push(el({ position: "absolute", top: "69px", left: "50%", transform: "translateX(-50%)", width: "15px", height: "10px", borderRadius: "4px 4px 12px 12px", background: "#d8526b", overflow: "hidden", zIndex: 7 },
        el({ position: "absolute", bottom: "0", left: "50%", transform: "translateX(-50%)", width: "8px", height: "4px", background: "#ff8aa0", borderRadius: "6px 6px 3px 3px" })));
    } else {
      parts.push(el({ position: "absolute", top: "70px", left: "50%", transform: "translateX(-50%)", width: "16px", height: "9px", borderRadius: "0 0 12px 12px", border: "3px solid #d8526b", borderTop: "none", zIndex: 7 }));
    }

    // accessories
    if (o.acc === "cap") {
      var cc = o.capColor || "#4dabf7";
      parts.push(el({ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", width: "80px", height: "34px", zIndex: 6 }, [
        el({ position: "absolute", bottom: "6px", left: "5px", width: "70px", height: "26px", borderRadius: "50% 50% 30% 30%", background: cc }),
        el({ position: "absolute", bottom: "4px", left: "-15px", width: "42px", height: "12px", borderRadius: "40% 0 0 60% / 70% 0 0 90%", background: cc, transform: "rotate(-7deg)" }),
        el({ position: "absolute", top: "0", left: "50%", transform: "translateX(-50%)", width: "9px", height: "9px", borderRadius: "50%", background: "rgba(255,255,255,0.6)" }),
      ]));
    }
    if (o.acc === "glasses") {
      parts.push(el({ position: "absolute", top: "48px", left: "50%", transform: "translateX(-50%)", width: "72px", height: "22px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 8 }, [
        el({ width: "23px", height: "22px", borderRadius: "50%", border: "3px solid #5a4038", background: "rgba(255,255,255,0.1)" }),
        el({ width: "8px", height: "3px", background: "#5a4038", borderRadius: "2px" }),
        el({ width: "23px", height: "22px", borderRadius: "50%", border: "3px solid #5a4038", background: "rgba(255,255,255,0.1)" }),
      ]));
    }
    if (o.acc === "party") {
      parts.push(el({ position: "absolute", top: "0px", left: "50%", width: "30px", height: "34px", transformOrigin: "50% 100%", zIndex: 9, animation: "whs-wiggle 2.2s ease-in-out infinite" }, [
        el({ position: "absolute", inset: "0", background: "repeating-linear-gradient(125deg,#ff6b9d 0 6px,#ffd23f 6px 12px)", clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }),
        el({ position: "absolute", top: "-6px", left: "50%", transform: "translateX(-50%)", width: "11px", height: "11px", borderRadius: "50%", background: "#5ac8fa", animation: "whs-bounce2 1.6s ease-in-out infinite" }),
      ]));
    }
    if (o.mustache) {
      parts.push(el({ position: "absolute", top: "63px", left: "50%", transform: "translateX(-50%)", width: "28px", height: "10px", zIndex: 7 }, [
        el({ position: "absolute", left: "0", top: "0", width: "15px", height: "10px", borderRadius: "60% 10% 50% 70%", background: hc, transform: "rotate(-4deg)" }),
        el({ position: "absolute", right: "0", top: "0", width: "15px", height: "10px", borderRadius: "10% 60% 70% 50%", background: hc, transform: "rotate(4deg)" }),
      ]));
    }
    if (o.earrings) {
      var ec = o.earringColor || "#ffce3d";
      parts.push(el({ position: "absolute", top: "71px", left: "14px", width: "7px", height: "7px", borderRadius: "50%", background: ec, boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.1)", zIndex: 6 }));
      parts.push(el({ position: "absolute", top: "71px", right: "14px", width: "7px", height: "7px", borderRadius: "50%", background: ec, boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.1)", zIndex: 6 }));
    }
    if (o.freckles) {
      [[28, 64], [34, 60], [80, 64], [86, 60]].forEach(function (f) {
        parts.push(el({ position: "absolute", top: f[1] + "px", left: f[0] + "px", width: "3.5px", height: "3.5px", borderRadius: "50%", background: "rgba(170,110,80,0.6)", zIndex: 8 }));
      });
    }

    // floats (sparkles)
    function sparkAt(l, tp, s, color, d) {
      return el({ position: "absolute", left: l + "px", top: tp + "px", color: color, fontSize: s + "px", lineHeight: 1, zIndex: 9, animation: "whs-pop 2.1s ease-in-out " + d + "s infinite" }, "✦");
    }
    (o.floats || []).forEach(function (f) {
      if (f.t === "spark") parts.push(sparkAt(f.l, f.tp, f.s, f.c, f.d));
    });

    var floatGroup = el({ position: "absolute", inset: "0", transformOrigin: "50% 82%", animation: "whs-bob 3.6s ease-in-out " + (i * 0.3).toFixed(2) + "s infinite" }, parts);
    return el({ position: "relative", width: W + "px", height: W + "px", borderRadius: "50%", overflow: "hidden", background: o.bg, boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.6), 0 8px 20px -10px rgba(60,10,40,0.25)" }, floatGroup);
  }

  var CHARACTERS = [
    { key: "bestfriend", name: "Best Friend", role: "your ride-or-die", cfg: { bg: "linear-gradient(#ffe0ec,#ffc2db)", hair: "#7a4a2e", hairShade: "#5f3722", hairStyle: "bob", expr: "grin", cheek: "rgba(255,138,150,0.85)" } },
    { key: "partner", name: "Partner", role: "your other half", cfg: { bg: "linear-gradient(#ffd6e2,#ffb6cb)", hair: "#3a291d", hairShade: "#291b12", hairStyle: "neutral", expr: "heart" } },
    { key: "sibling", name: "Sibling", role: "partner in crime", cfg: { bg: "linear-gradient(#dcecff,#bcd6ff)", hair: "#3a2418", hairStyle: "short", expr: "grin", acc: "cap", capColor: "#3a7bd5" } },
    { key: "mom", name: "Mom", role: "the one who made you", cfg: { bg: "linear-gradient(#ffe8cf,#ffd2a0)", hair: "#6b4128", hairShade: "#52301d", hairStyle: "bun", expr: "smile", earrings: true, earringColor: "#ff7ab8" } },
    { key: "dad", name: "Dad", role: "the original hero", cfg: { bg: "linear-gradient(#d4ece2,#aadcc8)", hair: "#3a2a1e", hairStyle: "short", expr: "smile", acc: "glasses", mustache: true } },
    { key: "bestie", name: "Bestie", role: "your favourite person", cfg: { bg: "linear-gradient(#f3d8ff,#e3b8ff)", hair: "#4a3526", hairShade: "#372616", hairStyle: "neutral", expr: "grin", floats: [{ t: "spark", l: 6, tp: 16, s: 14, c: "#e0b3ff", d: 0.2 }, { t: "spark", l: 98, tp: 54, s: 11, c: "#fff", d: 0.9 }] } },
    { key: "funny", name: "The Funny One", role: "never serious", cfg: { bg: "linear-gradient(#fff3cf,#ffe08a)", hair: "#c75e2a", hairStyle: "short", expr: "wink", acc: "party" } },
    { key: "cousin", name: "Cousin", role: "family + friend", cfg: { bg: "linear-gradient(#dcf6da,#b7ecb4)", hair: "#2a1a12", hairShade: "#1c110b", hairStyle: "curly", expr: "smile", freckles: true } },
  ];
  var CHAR_INDEX = {};
  CHARACTERS.forEach(function (c, i) { CHAR_INDEX[c.key] = i; });

  function characterHTML(key, idx) {
    var found = CHAR_INDEX[key];
    var i = found != null ? found : 0;
    return character(CHARACTERS[i].cfg, idx != null ? idx : i);
  }

  var api = { CAKES: CAKES, CHARACTERS: CHARACTERS, cakeHTML: cakeHTML, characterHTML: characterHTML, CAKE_INDEX: CAKE_INDEX, CHAR_INDEX: CHAR_INDEX };
  root.HeartArt = api;
})(typeof window !== "undefined" ? window : this);
