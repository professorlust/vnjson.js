
var vnjs = {
  
      plugins: {},
      TREE: {},
      DEBUG: false,
      playList: {},
      prevAudio: "",
      prevScreen: "",
      screenList: {}
};

vnjs.on = function(event, handler){
          if (!vnjs.plugins[event]) {
              vnjs.plugins[event] = [];
          };
          vnjs.plugins[event].push(handler);
};

vnjs.emit = function (event, ...args) {
         if (Array.isArray(vnjs.plugins[event])) {
            vnjs.plugins[event].map(function(handler){
                    handler.call(vnjs, ...args);
            });
         }
         /*
         else{
          Выводятся системные слушатели
          console.log(`Event [ ${event} ] not found`)
         }
         */
};
vnjs.off = function (event) {
        delete vnjs.plugins[event];
};

/*
 * В {state} должно помещаться все то
 * что сохроняется в карту памяти
 * И что важно загрузить из нее без последствий.
 * В состоянии не должно быть мусора
 */
vnjs.state = {
  scene: 'scene',
  label: 'label',
  index: 0,
  screens: []
};
/*
 * Получает текущее тела из состояние
 */
vnjs.current = {
  
      scene: function (){
        return vnjs.TREE[vnjs.state.scene];
      },
      label: function (){
        return vnjs.TREE[vnjs.state.scene][vnjs.state.label];
      },
      object: function (){
        return vnjs.TREE[vnjs.state.scene][vnjs.state.label][vnjs.state.index];
     }
};


vnjs.setScene = function (name, body){
  this.TREE[name] = body;
  this.state.scene = name;

  body.characters.map(character=>{
    let aliase = Object.keys(character)[0];

    vnjs.on(aliase, function(reply){
          vnjs.emit('character', {aliase, param: character[aliase], reply } );

    });

});
  this.emit('load', body.assets);
 // this.parse();//??? Возможно это будет вызываться не здесь
};




vnjs.parse = function (obj){
  var ctx = null;
  if(obj){
    ctx = obj;
  }else{
    ctx = vnjs.current.object();
  };

  for(let event in ctx){

        vnjs.emit(event, ctx[event]);

  };

};


vnjs.next = function (){
  this.parse();
  this.state.index++;
  return '-------------------------';
};

vnjs.init = function (conf){
  vnjs.conf = conf;
 // this.parse({'jump': conf.entryScene});
  vnjs.emit('getScreens');
  return true;
};
