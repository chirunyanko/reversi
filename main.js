const cvs = document.querySelector("canvas");
const ctx = cvs.getContext("2d");
const text = document.querySelector(".text");

// クリックイベント
cvs.addEventListener("click", event => {
  game.clickEvents(event.offsetX, event.offsetY);
});

class Game {
  // タイトル
  static TITLE = "リバーシ";
  // 1マスの大きさ
  static SQUARESIZE = 50;
  // マスの数
  static SIZE = 8;
  // 1フレーム
  static FRAME = 1000 / 30;
  // スタイル
  static LINEWIDTH = 15;
  static COLORS = ["transparent", "black", "white", "green", "yellow"];
  static BACKCOLOR = "rgba(100, 100, 100, 0.4)";

  // タイトル
  static TITLEFONT = "bold 64px sanserif";
  static TITLEX = 200;
  static TITLEY = 120;

  // リザルト
  static RIZULTFONT = "bold 50px sanserif";
  static RIZULTX = 200;
  static RIZULTY = 130;
  static RIZULTTEXTLIST = ["黒の勝ち", "白の勝ち", "勝ち", "負け", "引き分け"];
  static RIZULTTEXTX = 200;
  static RIZULTTEXTY = 210;

  // ボタン
  static BUTTONFONT = "20px sanserif";
  static BUTTONWIDTH = 140;
  static BUTTONHEIGHT = 40;
  static BUTTONX = [40, 220, 130];
  static BUTTONY = [260, 255, 315];
  static BUTTONTEXTLIST = ["一人で遊ぶ", "二人で遊ぶ", "先手", "後手", "もう一度", "タイトルへ"];
  static BUTTONTEXTX = [200, 110, 290];
  static BUTTONTEXTY = [275, 335, 280];

  // 影
  static SHADOWCOLOR = "rgb(36, 36, 36)";
  static SHADOWOFFSET = 5;
  static SHADOWBLUR = 3;

  constructor() {
    // 0 -> スタート画面, 1 -> 黒ターン, 2 -> 白ターン, 3 -> リザルト画面
    this.status = 0;
    this.passFlag = false;
    this.npcFlag = false;
    this.npcStatus = 0;
    this.discs = [];
    this.bs = "";

    this.init();
    this.main();
  }

  // メイン関数
  main() {
    if (this.waitFrame > 0) {
      this.update();
      this.draw();
    }

    setTimeout(() => {
      this.main();
    }, Game.FRAME);
  }

  // 初期設定
  init() {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.initDiscs();
    this.waitFrame = 1;
  }

  // ディスク初期設定
  initDiscs() {
    this.discs = [];

    for (let y = 0; y < Game.SIZE; y++) {
      this.discs.push([]);
      for (let x = 0; x < Game.SIZE; x++) {
        this.discs[y].push(new Disc(x, y));
      }
    }

    this.discs[Game.SIZE / 2 - 1][Game.SIZE / 2 - 1].setStatus(2);
    this.discs[Game.SIZE / 2 - 1][Game.SIZE / 2].setStatus(1);
    this.discs[Game.SIZE / 2][Game.SIZE / 2 - 1].setStatus(1);
    this.discs[Game.SIZE / 2][Game.SIZE / 2].setStatus(2);
  }

  // クリックイベント
  clickEvents(x, y) {
    switch (this.status) {
      case 0:
        if (this.npcFlag) {
          // 先手
          if ((x >= 40 && x <= 40 + Game.BUTTONWIDTH) && (y >= 260 && y <= 260 + Game.BUTTONHEIGHT)) {
            this.npcFlag = false;
            this.npcStatus = 2;
            this.status = 1;
          }

          // 後手
          if ((x >= 220 && x <= 220 + Game.BUTTONWIDTH) && (y >= 260 && y <= 260 + Game.BUTTONHEIGHT)) {
            this.npcFlag = false;
            this.npcStatus = 1;
            this.status = 1;
          }
        } else {
          // 一人で遊ぶ
          if ((x >= 130 && x <= 130 + Game.BUTTONWIDTH) && (y >= 255 && y <= 255 + Game.BUTTONHEIGHT)) {
            this.npcFlag = true;
          }

          // 二人で遊ぶ
          if ((x >= 130 && x <= 130 + Game.BUTTONWIDTH) && (y >= 315 && y <= 315 + Game.BUTTONHEIGHT)) {
            this.status = 1;
          }
        }

        break;
      case 1:
      case 2:
        // 待ち時間中ならリターン
        if (this.waitFrame > 0) {
          return;
        }
  
        const posX = Math.floor(x / Game.SQUARESIZE);
        const posY = Math.floor(y / Game.SQUARESIZE);
  
        // ディスクが置けるか判定してOKならディスクを置く
        if (this.discs[posY][posX].countReverseDiscs() !== 0) {
          this.putDisc(posX, posY);
        }

        break;
      case 3:
        // もう一度
        if ((x >= 40 && x <= 40 + Game.BUTTONWIDTH) && (y >= 260 && y <= 260 + Game.BUTTONHEIGHT)) {
          this.init();
          this.status = 1;
        }

        // タイトルへ
        if ((x >= 220 && x <= 220 + Game.BUTTONWIDTH) && (y >= 260 && y <= 260 + Game.BUTTONHEIGHT)) {
          this.init();
          this.npcFlag = false;
          this.status = 0;
        }

        break;
    }
  }

  // 更新
  update() {
    switch (this.status) {
      case 1:
      case 2:
        this.waitFrame--;

        if (this.waitFrame === 0) {
          this.passFlag = false;
          this.updateReverseCounts();

          // パスの処理
          if (this.isPass()) {
            this.waitFrame = 15;
            this.passFlag = true;
            this.changeTurn();
            this.updateReverseCounts();
        
            // ターンを交替してもパスであればゲーム終了
            if (this.isPass()) {
              text.textContent = "";
              this.status = 3;
              return;
            }
          } else if (this.status === this.npcStatus) {
            if (this.npcFlag) {
              this.npcFunc();
              return;
            } else {
              this.waitFrame = 10;
              this.npcFlag = true;
            }
          }

          this.updateText();
        }

        this.updateDiscs();

        break;
    }
  }

  // 描画
  draw() {
    this.drawField();
    this.drawDiscs();

    switch (this.status) {
      case 0:
        this.drawTitle();
        break;
      case 3:
        this.drawResult();
        break;
    }
  }

  // this.statusが1なら2に、2なら1に変更
  changeTurn() {
    this.status = this.status % 2 + 1;
  }

  // パスか判定
  isPass() {
    for (let y = 0; y < Game.SIZE; y++) {
      for (let x = 0; x < Game.SIZE; x++) {
        if (this.discs[y][x].countReverseDiscs() !== 0) {
          return false;
        }
      }
    }

    return true;
  }

  // ディスクを置く
  putDisc(x, y) {
    this.discs[y][x].setStatus(this.status);
    this.reverseDiscs(x, y);
    this.changeTurn();
  }

  // ディスクをひっくり返す
  reverseDiscs(x, y) {
    for (let dirY = -1; dirY <= 1; dirY++) {
      for (let dirX = -1; dirX <= 1; dirX++) {
        let posX = x;
        let posY = y;
        let count = this.discs[y][x].getReverseCounts()[dirY + 1][dirX + 1];
        let i = 0;

        // 必要ならwaitFrame更新
        if (this.waitFrame < Disc.MAXMOVEFRAME + count * Disc.WAITFRAME) {
          this.waitFrame = Disc.MAXMOVEFRAME + count * Disc.WAITFRAME;
        }

        // count枚ひっくり返す
        while (count > i) {
          this.discs[posY + dirY][posX + dirX].reverse(i);

          posX += dirX;
          posY += dirY;
          i++;
        }
      }
    }
  }

  // 黒ディスクカウント
  blackCount() {
    let count = 0;

    for (let x = 0; x < Game.SIZE; x++) {
      for (let y = 0; y < Game.SIZE; y++) {
        if (this.discs[y][x].getStatus() === 1) {
          count++;
        }
      }
    }

    return count;
  }

  // 白ディスクカウント
  whiteCount() {
    let count = 0;

    for (let x = 0; x < Game.SIZE; x++) {
      for (let y = 0; y < Game.SIZE; y++) {
        if (this.discs[y][x].getStatus() === 2) {
          count++;
        }
      }
    }

    return count;
  }

  // npc
  npcFunc() {
    let reverseCount = 1;
    let reverseArray = [];

    for (let y = 0; y < Game.SIZE; y++) {
      for (let x = 0; x < Game.SIZE; x++) {
        if (this.discs[y][x].countReverseDiscs() > reverseCount) {
          reverseCount = this.discs[y][x].countReverseDiscs();
          reverseArray = [[x, y]];
        } else if (this.discs[y][x].countReverseDiscs() === reverseCount) {
          reverseArray.push([x, y]);
        }
      }
    }

    if (reverseArray.length !== 0) {
      let square = Math.floor(Math.random() * reverseArray.length);

      this.putDisc(reverseArray[square][0], reverseArray[square][1]);
    }

    this.npcFlag = false;
  }

  // パスの時の処理
  passFunc() {
    if (this.isPass()) {
      this.waitFrame = 15;
      this.passFlag = true;
      this.changeTurn();
      this.updateReverseCounts();
  
      // ターンを交替してもパスであればゲーム終了
      if (this.isPass()) {
        text.textContent = "";
        this.status = 3;
        return;
      }
    }
  }

  // ディスク更新
  updateDiscs() {
    for (let y = 0; y < Game.SIZE; y++) {
      for (let x = 0; x < Game.SIZE; x++) {
        this.discs[y][x].update();
      }
    }
  }

  // テキスト更新
  updateText() {
    if (this.passFlag) {
      text.textContent = "パス";
      return;
    }

    if (this.npcStatus === 0) {
      if (this.status === 1) {
        text.textContent = "黒の番です";
      } else if (this.status === 2) {
        text.textContent = "白の番です";
      }
    } else {
      if (this.status === this.npcStatus) {
        text.textContent = "コンピューターの番です";
      } else {
        text.textContent = "あなたの番です";
      }
    }
  }

  // リバースカウント更新
  updateReverseCounts() {
    for (let y = 0; y < Game.SIZE; y++) {
      for (let x = 0; x < Game.SIZE; x++) {
        this.discs[y][x].resetReverseCounts();
    
        // 駒が既に置かれていたら終了
        if (!this.discs[y][x].isStatusZero()) {
          continue;
        }
    
        for (let dirY = -1; dirY <= 1; dirY++) {
          for (let dirX = -1; dirX <= 1; dirX++) {
            let posX = x + dirX;
            let posY = y + dirY;
    
            // 枠の外なら終了
            if (Math.floor(posX / Game.SIZE) !== 0 || Math.floor(posY / Game.SIZE) !== 0) {
              continue;
            }
    
            // 隣にある駒が置く駒と反対の色かでなければ終了
            if (!this.discs[posY][posX].isOpposeDisc(this.status)) {
              continue;
            }
    
            while (true) {
              // 枠の外なら終了
              if (Math.floor((posX) / Game.SIZE) !== 0 || Math.floor((posY) / Game.SIZE) !== 0) {
                this.discs[y][x].setReverseCountZero(dirX + 1, dirY + 1);
                break;
              }
              
              // this.statusと同じ駒があれば終了
              if (this.discs[posY][posX].getStatus() === this.status) {
                break;
              }
              
              // 駒がなければreverseCountを0にして終了
              if (this.discs[posY][posX].isStatusZero()) {
                this.discs[y][x].setReverseCountZero(dirX + 1, dirY + 1);
                break;
              }
    
              this.discs[y][x].addReverseCount(dirX + 1, dirY + 1);
              posX += dirX;
              posY += dirY;
            }
          }
        }
      }
    }
  }

  // タイトル描画
  drawTitle() {
    ctx.fillStyle = Game.BACKCOLOR;
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    ctx.font = Game.TITLEFONT;
    ctx.lineWidth = Game.LINEWIDTH;
    ctx.shadowColor = Game.SHADOWCOLOR;
    ctx.shadowOffsetX = Game.SHADOWOFFSET;
    ctx.shadowOffsetY = Game.SHADOWOFFSET;
    ctx.shadowBlur = Game.SHADOWBLUR;

    ctx.strokeStyle = Game.COLORS[2];
    ctx.strokeText(Game.TITLE, Game.TITLEX, Game.TITLEY);

    ctx.fillStyle = Game.COLORS[1];
    ctx.shadowColor = Game.COLORS[0];
    ctx.fillText(Game.TITLE, Game.TITLEX, Game.TITLEY);

    if (this.npcFlag) {
      ctx.fillStyle = Game.COLORS[2];
      ctx.shadowColor = Game.SHADOWCOLOR;
      ctx.fillRect(Game.BUTTONX[0], Game.BUTTONY[0], Game.BUTTONWIDTH, Game.BUTTONHEIGHT);
      ctx.fillRect(Game.BUTTONX[1], Game.BUTTONY[0], Game.BUTTONWIDTH, Game.BUTTONHEIGHT);
  
      ctx.font = Game.BUTTONFONT;
      ctx.fillStyle = Game.COLORS[1];
      ctx.shadowColor = Game.COLORS[0];
      ctx.fillText(Game.BUTTONTEXTLIST[2], Game.BUTTONTEXTX[1], Game.BUTTONTEXTY[2]);
      ctx.fillText(Game.BUTTONTEXTLIST[3], Game.BUTTONTEXTX[2], Game.BUTTONTEXTY[2]);
    } else {
      ctx.fillStyle = Game.COLORS[2];
      ctx.shadowColor = Game.SHADOWCOLOR;
      ctx.fillRect(Game.BUTTONX[2], Game.BUTTONY[1], Game.BUTTONWIDTH, Game.BUTTONHEIGHT);
      ctx.fillRect(Game.BUTTONX[2], Game.BUTTONY[2], Game.BUTTONWIDTH, Game.BUTTONHEIGHT);

      ctx.font = Game.BUTTONFONT;
      ctx.fillStyle = Game.COLORS[1];
      ctx.shadowColor = Game.COLORS[0];
      ctx.fillText(Game.BUTTONTEXTLIST[0], Game.BUTTONTEXTX[0], Game.BUTTONTEXTY[0]);
      ctx.fillText(Game.BUTTONTEXTLIST[1], Game.BUTTONTEXTX[0], Game.BUTTONTEXTY[1]);
    }
  }

  // リザルト描画
  drawResult() {
    ctx.fillStyle = Game.BACKCOLOR;
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    ctx.shadowColor = Game.SHADOWCOLOR;
    ctx.shadowOffsetX = Game.SHADOWOFFSET;
    ctx.shadowOffsetY = Game.SHADOWOFFSET;
    ctx.shadowBlur = Game.SHADOWCOLOR;

    ctx.font = Game.RIZULTFONT;
    ctx.fillStyle = Game.COLORS[2];
    ctx.fillText(`黒: ${this.blackCount()} 白: ${this.whiteCount()}`, Game.RIZULTX, Game.RIZULTY);

    if (this.blackCount() > this.whiteCount()) {
      switch (this.npcStatus) {
        case 0:
          ctx.fillText(Game.RIZULTTEXTLIST[0], Game.RIZULTTEXTX, Game.RIZULTTEXTY);
          break;
        case 1:
          ctx.fillText(Game.RIZULTTEXTLIST[3], Game.RIZULTTEXTX, Game.RIZULTTEXTY);
          break;
        case 2:
          ctx.fillText(Game.RIZULTTEXTLIST[2], Game.RIZULTTEXTX, Game.RIZULTTEXTY);
          break;
      }
    } else if (this.blackCount() < this.whiteCount()) {
      switch (this.npcStatus) {
        case 0:
          ctx.fillText(Game.RIZULTTEXTLIST[1], Game.RIZULTTEXTX, Game.RIZULTTEXTY);
          break;
        case 1:
          ctx.fillText(Game.RIZULTTEXTLIST[2], Game.RIZULTTEXTX, Game.RIZULTTEXTY);
          break;
        case 2:
          ctx.fillText(Game.RIZULTTEXTLIST[3], Game.RIZULTTEXTX, Game.RIZULTTEXTY);
          break;
      }
    } else {
      ctx.fillText(Game.RIZULTTEXTLIST[4], Game.RIZULTTEXTX, Game.RIZULTTEXTY);
    }

    ctx.fillRect(Game.BUTTONX[0], Game.BUTTONY[0], Game.BUTTONWIDTH, Game.BUTTONHEIGHT);
    ctx.fillRect(Game.BUTTONX[1], Game.BUTTONY[0], Game.BUTTONWIDTH, Game.BUTTONHEIGHT);

    ctx.font = Game.BUTTONFONT;
    ctx.fillStyle = Game.COLORS[1];
    ctx.shadowColor = Game.COLORS[0];
    ctx.fillText(Game.BUTTONTEXTLIST[4], Game.BUTTONTEXTX[1], Game.BUTTONTEXTY[2]);
    ctx.fillText(Game.BUTTONTEXTLIST[5], Game.BUTTONTEXTX[2], Game.BUTTONTEXTY[2]);
  }

  // フィールド描画
  drawField() {
    this.drawSquares();
    this.drawBoxCircle();
    this.drawOuterLine();
  }

  // マス描画
  drawSquares() {
    ctx.strokeStyle = Game.COLORS[1];
    ctx.lineWidth = 2;
    
    for (let y = 0; y < Game.SIZE; y++) {
      for (let x = 0; x < Game.SIZE; x++) {
        if (this.waitFrame > 0) {
          ctx.fillStyle = Game.COLORS[3];
        } else if (this.discs[y][x].countReverseDiscs() === 0) {
          ctx.fillStyle = Game.COLORS[3];
        } else {
          ctx.fillStyle = Game.COLORS[4];
        }

        ctx.fillRect(x * Game.SQUARESIZE, y * Game.SQUARESIZE, (x + 1) * Game.SQUARESIZE, (y + 1) * Game.SQUARESIZE + 1);
        ctx.strokeRect(x * Game.SQUARESIZE, y * Game.SQUARESIZE, (x + 1) * Game.SQUARESIZE, (y + 1) * Game.SQUARESIZE + 1);
      }
    }
  }

  // ボックスサークル描画
  drawBoxCircle() {
    ctx.fillStyle = Game.COLORS[1];

    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        ctx.beginPath();
        ctx.arc(x * (Game.SQUARESIZE * (Game.SIZE - 4)) + (Game.SQUARESIZE * 2), y * (Game.SQUARESIZE * (Game.SIZE - 4)) + (Game.SQUARESIZE * 2), 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  // 外枠描画
  drawOuterLine() {
    ctx.strokeStyle = Game.COLORS[1];
    ctx.lineWidth = 4;

    ctx.strokeRect(0, 0, cvs.width, cvs.height);
  }

  // ディスク描画
  drawDiscs() {
    for (let y = 0; y < Game.SIZE; y++) {
      for (let x = 0; x < Game.SIZE; x++) {
        this.discs[y][x].draw();
      }
    }
  }
}

class Disc {
  // 半径
  static RADIUS = 20;
  static REVERSECOUNTSSIZE = 3;
  
  // 状態一覧
  static MAXMOVEFRAME = 10;
  static WAITFRAME = 2;

  // 影
  static SHADOWCOLOR = "rgb(36, 36, 36)";
  static SHADOWOFFSET = 2;

  constructor(x, y) {
    // 状態 0 -> null, 1 -> black, 2 -> white
    this.status = 0;
    this.waitFrame = 0;
    this.moveFrame = Disc.MAXMOVEFRAME;
    // ディスクを置いたときにひっくり返せる枚数
    this.reverseCounts = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    // 座標
    this.x = x;
    this.y = y;
  }

  getStatus() {
    return this.status;
  }

  setStatus(status) {
    this.status = status;
  }

  getReverseCounts() {
    return this.reverseCounts;
  }

  // ステータスが0か判定
  isStatusZero() {
    return this.status === 0;
  }

  // ディスクが目的のディスクと逆の色か判定
  isOpposeDisc(targetDiscStatus) {
    return this.status !== 0 && this.status !== targetDiscStatus;
  }

  // リバースカウントが0にする
  setReverseCountZero(x, y) {
    this.reverseCounts[y][x] = 0;
  }

  // リバースカウント追加
  addReverseCount(x, y) {
    this.reverseCounts[y][x]++;
  }

  // リバースカウントズをリセット
  resetReverseCounts() {
    for (let x = 0; x < Disc.REVERSECOUNTSSIZE; x++) {
      for (let y = 0; y < Disc.REVERSECOUNTSSIZE; y++) {
        this.reverseCounts[y][x] = 0;
      }
    }
  }

  // ディスクを置いたときにひっくる返せる枚数をカウント
  countReverseDiscs() {
    let count = 0;

    for (let y = 0; y < Disc.REVERSECOUNTSSIZE; y++) {
      for (let x = 0; x < Disc.REVERSECOUNTSSIZE; x++) {
        count += this.reverseCounts[y][x];
      }
    }

    return count;
  }

  // 反転
  reverse(i) {
    if (this.status === 0) {
      return;
    }

    this.moveFrame = 0;
    this.waitFrame = i * Disc.WAITFRAME;

    this.status = this.status % 2 + 1;
  }

  // 更新
  update () {
    if (this.moveFrame >= Disc.MAXMOVEFRAME) {
      return;
    }

    if (this.waitFrame > 0) {
      this.waitFrame--;
    } else {
      this.moveFrame++;
    }
  }

  // 描画
  draw() {
    if (this.status === 0) {
      return;
    }

    if (this.waitFrame > 0) {
      
      ctx.shadowColor = Disc.SHADOWCOLOR;
      ctx.shadowOffsetX = Disc.SHADOWOFFSET;
      ctx.shadowOffsetY = Disc.SHADOWOFFSET;

      this.drawBack();

      ctx.shadowColor = "transparent";
    } else if (this.moveFrame < Disc.MAXMOVEFRAME / 2) {
      ctx.shadowColor = Disc.SHADOWCOLOR;
      ctx.shadowOffsetX = Disc.SHADOWOFFSET;
      ctx.shadowOffsetY = Disc.SHADOWOFFSET;
      
      this.drawFront();
      this.drawBack();

      ctx.shadowColor = "transparent";
    } else if (this.moveFrame < Disc.MAXMOVEFRAME) {
      ctx.shadowColor = Disc.SHADOWCOLOR;
      ctx.shadowOffsetX = Disc.SHADOWOFFSET;
      ctx.shadowOffsetY = Disc.SHADOWOFFSET;
      
      this.drawBack();
      this.drawFront();

      ctx.shadowColor = "transparent";
    } else {
      ctx.shadowColor = Disc.SHADOWCOLOR;
      ctx.shadowOffsetX = Disc.SHADOWOFFSET;
      ctx.shadowOffsetY = Disc.SHADOWOFFSET;
      
      this.drawFront();

      ctx.shadowColor = "transparent";
    }
  }

  // 表になる方の描画
  drawFront() {
    ctx.fillStyle = Game.COLORS[this.status];

    ctx.beginPath();
    ctx.ellipse(this.x * Game.SQUARESIZE + Game.SQUARESIZE / 2 - Math.sin((this.moveFrame / Disc.MAXMOVEFRAME) * Math.PI), this.y * Game.SQUARESIZE + Game.SQUARESIZE / 2, Disc.RADIUS * Math.abs(Math.cos((this.moveFrame / Disc.MAXMOVEFRAME) * Math.PI)), Disc.RADIUS, 0, 0, 2 * Math.PI);
    ctx.fill();
  }

  // 裏になる方の描画
  drawBack() {
    ctx.fillStyle = Game.COLORS[this.status % 2 + 1];

    ctx.beginPath();
    ctx.ellipse(this.x * Game.SQUARESIZE + Game.SQUARESIZE / 2 + Math.sin((this.moveFrame / Disc.MAXMOVEFRAME) * Math.PI), this.y * Game.SQUARESIZE + Game.SQUARESIZE / 2, Disc.RADIUS * Math.abs(Math.cos((this.moveFrame / Disc.MAXMOVEFRAME) * Math.PI)), Disc.RADIUS, 0, 0, 2 * Math.PI);
    ctx.fill();
  }
}

let game = new Game();