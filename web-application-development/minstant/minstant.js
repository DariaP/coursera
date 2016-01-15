Chats = new Mongo.Collection("chats");

if (Meteor.isClient) {

  Meteor.subscribe("chats");
  Meteor.subscribe("users");

  // set up the main template the the router will use to build pages
  Router.configure({
    layoutTemplate: 'ApplicationLayout'
  });
  // specify the top level route, the page users see when they arrive at the site
  Router.route('/', function () {
    this.render("navbar", {to:"header"});
    this.render("lobby_page", {to:"main"});  
  });

  // specify a route that allows the current user to chat to another users
  Router.route('/chat/:_id', function () {
    // the user they want to chat to has id equal to 
    // the id sent in after /chat/... 
    var otherUserId = this.params._id,
        that = this;

    Meteor.call("addChat", 
      otherUserId,
      function(err, res) {
        if (!err){
          Session.set("chatId", res);
          that.render("navbar", {to:"header"});
          that.render("chat_page", {to:"main"});  
        }
      }
    );


  });

  ///
  // helper functions 
  /// 
  Template.available_user_list.helpers({
    users:function(){
      return Meteor.users.find();
    }
  })
 Template.available_user.helpers({
    getUsername:function(userId){
      user = Meteor.users.findOne({_id:userId});
      return user.profile.username;
    }, 
    isMyUser:function(userId){
      if (userId == Meteor.userId()){
        return true;
      }
      else {
        return false;
      }
    }
  })


  Template.chat_page.helpers({
    messages:function() {
      var chat = Chats.findOne({_id:Session.get("chatId")});
      return chat.messages;
    }, 
    other_user:function(){
      return ""
    }, 

    emoticons: function() {
      return [
        {img: "/blink.png", alt: '*blink*'},
        {img: "/grin.png", alt: '*grin*'},
        {img: "/love.png", alt: '*love*'},
        {img: "/mad.png", alt: '*mad*'},
        {img: "/sad.png", alt: '*sad*'},
        {img: "/sick.png", alt: '*sick*'},
        {img: "/smartass.png", alt: '*smartass*'},
        {img: "/smile.png", alt: '*smile*'},
        {img: "/sorry.png", alt: '*sorry*'},
        {img: "/sunglasses.png", alt: '*sunglasses*'},
        {img: "/tongue.png", alt: '*tongue*'}
      ];
    }
  })
 Template.chat_page.events({
  // this event fires when the user sends a message on the chat page
  'submit .js-send-chat':function(event){
    // stop the form from triggering a page reload
    event.preventDefault();

    Meteor.call("addMessage", 
      Session.get("chatId"), 
      event.target.chat.value, 
      function(err, res) {
        event.target.chat.value = "";
      }
    );
  },

  'click .add-emoticon':function(event){
    event.preventDefault();

    var imgHTML = event.target.innerHTML;
    if (imgHTML.length === 0) {
      imgHTML = event.target.outerHTML;
    }

    var input = document.getElementById('message-input');
    input.value = input.value + imgHTML;
  }
 })

  Template.chat_message.helpers({
    avatar:function(userId){
      user = Meteor.users.findOne({_id: userId});
      if (user) {
        return user.profile.avatar;
      }
    } 
  })
}


// start up script that creates some users for testing
// users have the username 'user1@test.com' .. 'user8@test.com'
// and the password test123 

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (!Meteor.users.findOne()){
      for (var i=1;i<9;i++){
        var email = "user"+i+"@test.com";
        var username = "user"+i;
        var avatar = "ava"+i+".png"
        console.log("creating a user with password 'test123' and username/ email: "+email);
        Meteor.users.insert({profile:{username:username, avatar:avatar}, emails:[{address:email}],services:{ password:{"bcrypt" : "$2a$10$I3erQ084OiyILTv8ybtQ4ON6wusgPbMZ6.P33zzSDei.BbDL.Q4EO"}}});
      }
    } 
  });

  // publish a list of users
  Meteor.publish("users", function() {
    return Meteor.users.find();
  })

  // publish a list of chats the user can se
  Meteor.publish("chats", function() {
    return Chats.find({
      $or:[
        {user1Id: this.userId}, 
        {user2Id: this.userId}
      ]
    });
  })
}

Meteor.methods({
  addChat: function(otherUserId) {
    // find a chat that has two users that match current user id
    // and the requested user id
    var filter = {$or:[
                {user1Id:Meteor.userId(), user2Id:otherUserId}, 
                {user2Id:Meteor.userId(), user1Id:otherUserId}
                ]};
    var chat = Chats.findOne(filter);
    if (!chat){// no chat matching the filter - need to insert a new one
      return Chats.insert({user1Id:Meteor.userId(), user2Id:otherUserId});
    }
    else {// there is a chat going already - use that. 
      return chat._id;
    }
  },

  addMessage: function(chatId, message){
    // see if we can find a chat object in the database
    // to which we'll add the message
    var chat = Chats.findOne({_id:chatId});
    if (chat){// ok - we have a chat to use
      var msgs = chat.messages; // pull the messages property
      if (!msgs){// no messages yet, create a new array
        msgs = [];
      }
      // is a good idea to insert data straight from the form
      // (i.e. the user) into the database?? certainly not. 
      // push adds the message to the end of the array
      msgs.push({text: message, userId: this.userId});

      // reset the form

      // put the messages array onto the chat object
      chat.messages = msgs;
      // update the chat object in the database.
      Chats.update(chat._id, chat);
    }
  }
})
