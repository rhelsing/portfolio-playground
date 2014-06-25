Portfolios = new Meteor.Collection("portfolios");

if (Meteor.isClient) {
  Template.site.portfolios = function () {
    return Portfolios.find({});
  };
  Template.site.holdings = function () {
    //update with current session id
    var port =Portfolios.findOne(Session.get('id'));
    if(port){
      return port.holdings;
    }else{
      return 0;
    }
    //return Portfolios.findOne(Session.get('id'));
    //return Session.get('id');
  };

  //update value of stock on regular interval
  //sum total
  Meteor.setInterval(update, 6000);


  function update(){
    var portfolios = Portfolios.find({});
    var all = portfolios.collection.docs;
    $.each( all, function( index, value ){
      var portfolio = Portfolios.findOne(index);
      var arr = portfolio.holdings;
      try{
      for(var i=0;i<arr.length;i++){
        var symbol = arr[i].symbol;
        var number = arr[i].number;
        updateSymbol(symbol, index, i, number);
      }
      }catch(err){
      }
      updateAccount(index);
    });
    //for each account
      //for each symbol
        //update value

    //also update value of each account
  }

  function updateAccount(index){
    var sum = 0;//ammount + each of holdings values
    var port =Portfolios.findOne(index);
    sum += parseFloat(port.amount);
    var arr = port.holdings;
    try{
      for(var i=0;i<arr.length;i++){
        var value = arr[i].value;
        sum += parseFloat(value);
      }
      }catch(err){
      }
    console.log(sum);
    Portfolios.update(index ,{$set: {sum:sum}});
  };

  //SEE http://jsfiddle.net/6EFqk/1/

  function updateSymbol(symbol, portfolio, elm, number){
    //update
    var newPrice;
    $.ajax({
      type: 'GET',
      url: "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%3D%22' + symbol + '%22&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=",
      dataType: 'json',
      success: function(data) { newPrice = data.query.results.quote.Ask;  },
      data: {},
      async: false
    });
    newPrice=newPrice*number;
    console.log("set "+symbol+" :"+newPrice+" num:"+number+" elm: "+elm);
    if(elm==0){
      Portfolios.update(portfolio, {$set: {"holdings.0" : {symbol: symbol, number:number, value:newPrice}}});
      console.log(0);
    }else if(elm==1){
      console.log(1);
      Portfolios.update(portfolio, {$set: {"holdings.1" : {symbol: symbol, number:number, value:newPrice}}});
    }else if(elm==2){
      console.log(3);
      Portfolios.update(portfolio, {$set: {"holdings.2" : {symbol: symbol, number:number, value:newPrice}}});
    }
  }

  Template.site.events = {
    'click #new' : function () {
        //alert('new');
        $("#method").val("");
        $("#edit_modal").toggle();
      },
      'click #save' : function () {
        var name = $("#name").val();
        var amount = $("#amount").val();
        var method = $("#method").val();
        var fee = $("#fee").val();
        if(method){
          if( name && amount && fee){
          Portfolios.update(method ,{$set: {name: name, amount:amount, fee: fee, sum:amount}});
          $("#edit_modal").hide();
          $("#name").val("");
          $("#amount").val("");
          $("#fee").val("");
        }
        }else{
          if( name && amount && fee){
          Portfolios.insert({name: name, amount:amount, fee: fee, sum:amount});
          $("#edit_modal").hide();
          $("#name").val("");
          $("#amount").val("");
          $("#fee").val("");
        }
        }
      },
      'click #cancel' : function () {
        $("#edit_modal").hide();
        $("#name").val("");
          $("#amount").val("");
          $("#fee").val("");
      },
      'click #add' : function () {
        var symbol = $("#symbol").val();
        var number = $("#number").val();
        var price = null;
        if( symbol || number){
          //checks and balances here
          $.getJSON("http://query.yahooapis.com/v1/public/yql?q=select%20%2a%20from%20yahoo.finance.quotes%20WHERE%20symbol=%27"+symbol+"%27&format=json&diagnostics=true&env=store://datatables.org/alltableswithkeys&callback", function(data) {
            price = data.query.results.quote.Ask;
            var port = Portfolios.findOne(Session.get('id'));
            var cost = price*number;
            if(port.amount < cost){
              console.log("out of price range");
           }else{
             console.log("ok");
             var newAmount = port.amount - cost;
             Portfolios.update(Session.get('id') ,{$addToSet: {holdings:{symbol: symbol, number:number, value: cost}}});
             Portfolios.update(Session.get('id') ,{$set: {amount: newAmount}});
             $("#symbol").val("");
             $("#number").val("");
           }
          });
        }
      },
      'click .manage' : function () {
        var id=event.srcElement.id;
        Session.set('id', id);
        //$("#shares_modal").show();
      },
      'click .edit' : function (event) {
        var id=event.srcElement.id;
        var obj = Portfolios.findOne(id);
        $("#name").val(obj.name);
        $("#amount").val(obj.amount);
        $("#fee").val(obj.fee);
        $("#edit_modal").show();
        $("#method").val(id);
      },
      'click .delete' : function (event) {
        var id=event.srcElement.id;
        Portfolios.remove(id);
      },
  };

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
