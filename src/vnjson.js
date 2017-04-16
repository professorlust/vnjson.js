
import parse            from './parse';
import memoryCard       from './memory-card';


/**
 * Глобальное хранилище вызываемых методов из
 * пользовательского скрипта
 * 
 */
var catalog = [
      { 
        event: 'jump',
        handler: jump
      },
      {
        event: "left",
        handler: function (data, event){
           let left = document.getElementById('left');
           //left.innerHTML = `<img src="/game/assets/${data}.png"`;
        }
      },
      {
        event: "right",
        handler: function (data, event){
          let right = document.getElementById('right');
          // right.innerHTML = `<img src="/game/assets/${data}.png"`;
        }
      },
      {
        event: "sound",
        handler: function (data, event){
          console.log(event+": "+data);
        }
      },
      {
        event: "audio",
        handler: function (data, event){
          console.log(event+": "+data);
        }
      },
      {
        event: "scene",
        handler: function (data, event){
          let scene = document.getElementById('scene');
          // scene.innerHTML = `<img src="/game/assets/${data}.png"`;

        }
      },      
      {
        event: "center",
        handler: function (data, event){
          let center = document.getElementById('center');
          // center.innerHTML = `<img src="/game/assets/${data}.png"`;
        }
      }
];

/*
 * game
 */

var game = {
    init: {},
    scenes: {}
};

/*
 * context
 * Значение объекта равно состоянию приложения.
 */
var ctx = {
  scene:'scene',
  label:'label',
  arr: [],
  obj: null,
  num: 0,
};
/*
 * memory card
 * Набросал грубый вид сохраненок в игре
 */
function saveGame(title){
  let data = {
    scene: ctx.scene,
    label: ctx.label,
    num: ctx.num,
    title: title,
    gameTitle: 'demo'
  }
  memoryCard.save(data);
};
function loadGame(title){

  memoryCard.load(title);
}

/**
 * plugins
 */
function on(event, handler, flag){
   console.log("plugin: "+event);
  
};

/**
 * init
 */
function init(param){
  game.init = param;

marmottajax('/game/layers.html').success(function(body) {
     document.getElementById('game').innerHTML = body;
     jump(game.init.entry);
});
 
};
/*
 * click handler
 */
function emitEvent(){
    let screen = document.getElementById(game.init.screen);
        //parse(ctx, catalog);
    screen.addEventListener('mousedown',function(){
        parse(ctx, catalog);
    });
};



function jump(pathname){
 /*
  * Если есть слэш в пути прыжка
  * то это сцена, значит надо подружать
  * ресурсы и т.д.
  */
let isScene = /\/\w+/gi.test(pathname);

if(isScene){
   console.info(`[ ${pathname} ]`);
  const pathArr = pathname.split('/');
  ctx.num = 0;
  ctx.scene = pathArr[0];
  ctx.label  = pathArr[1];
 
  getScene(ctx.scene);

 
}
  /*
   * Если слэша нет, то это значит лабел.
   * поэтому не надо делать лишних телодвижений
   * а просто выполнить уже загруженный массив
   */
else{
 
   ctx.num = 0;
   ctx.label = pathname;
   ctx.arr = game.scenes[ctx.scene].labels[ctx.label];
   console.warn('[ is label ]: '+pathname);
   parse(ctx, catalog);
};
};

/*
 * getScene
 */

function getScene(scene){

const pathToScene = `game/${game.init.scenes}/${game.init.local}/${scene}.json`;

marmottajax({
    url: pathToScene,
    json: true
}).success(function(data) {
    // result


   
    game.scenes[ctx.scene] = data;

    const _SCENE = game.scenes[ctx.scene];
   
    
    ctx.arr = _SCENE.labels[ctx.label];
    /*
     * Логирую для удобства разработки
     *
     */
    console.log('---------assets---------------');
    console.log(_SCENE.assets);


    console.log('---------characters-----------');
    console.log(_SCENE.characters);


    console.log('---------labels-----------');
    console.log(_SCENE.labels);
    /** 
     * Склеиваю персонажей из сцены в каталог
     *
     */
    catalog = catalog.concat(_SCENE.characters);
    /**
      * click
      */
     emitEvent();
 });
};

/*
 * @api
 */
export {
  on,
  ctx,
  init,
  game,
  catalog,
  loadGame,
  saveGame
};