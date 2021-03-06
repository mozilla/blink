App.UserController = Em.ObjectController.extend({
  gravatar_options: "d=mm",
  authClient: null,
  userRef: null,
  baseRef: new Firebase('https://caravela.firebaseio.com/'),

  afterLoginTransition: null,

  record_state: "Save",

  init: function(){
    this._super();
    var self=this,
        baseRef = this.get('baseRef');

    this.set(
      'authClient', 
      new FirebaseSimpleLogin (baseRef, function(err,usr){
        return self.update_user(err,usr);
      })
    );
    
  },

  publishInsight: function(insight){
    insight['avatar_url'] = this.get('content.avatar_url');
    insight['nickname'] = this.get('content.nickname');
    insight['ownerId'] = this.get('content.publicId');
    insight['updated_at'] = Firebase.ServerValue.TIMESTAMP;

    this.get('baseRef').child('feed/'+insight.id).setWithPriority(
      insight,
      Firebase.ServerValue.TIMESTAMP
    );
  },

  update_user: function(err,usr){
    if (err){
      console.log('firebase error', err)          
    }else{
      if (!usr){
        this.set('content', null);
        this.set('userRef', null);
      }else{

        var baseRef = this.get('baseRef'), 
            userRef = baseRef.child('users/'+usr.id),
            self=this;

        this.set('userRef', userRef);
        userRef.transaction(
          function(current_value) {
            if(!current_value){
              return {
                'email': usr.email,
                'nickname': null,
                'publicId': usr.md5_hash,
                'avatar_url': "https://www.gravatar.com/avatar/%@".fmt(
                  usr.md5_hash
                ),
                'status': 'pending',
                'created_at':  Firebase.ServerValue.TIMESTAMP,
                'updated_at':  Firebase.ServerValue.TIMESTAMP
              }
            }
          },
          function(){
            
            userRef.on('value', function(snapshot){
              var user = snapshot.val();
              user.id = snapshot.name();
              self.set('content', user);
              
              var transition = self.get('afterLoginTransition');
              if(transition){
                self.set('afterLoginTransition', null);
                transition.retry();
              }

            });
            
          }
        );
        


      }
    }
  },

  is_anonymous: function(){
    return !this.get('content')
  }.property('content'),

  is_pending: function(){
    return this.get('content.status') == 'pending'
  }.property('content'),

  avatar_url: function(){
    
    var url;
    if(this.get('is_anonymous')){
      url =  "https://www.gravatar.com/avatar/00000000"       
    }else{
      url = this.content.avatar_url;
    }
    return "%@?%@".fmt(url, this.get('gravatar_options'));

  }.property('content.avatar_url'),

  login: function(){
    this.authClient.login('persona',  {
      rememberMe: true
    });
  },

  logout: function(){
    this.authClient.logout();
  },

  nickname: function(key, value){
    if (arguments.length == 1){
      return this.get('content.nickname')
    }
    // we'll rely on save to send it back to the server
    this.set('record_state','Save');
    return value;
  }.property('content'),

  save: function(){
    var nickname = this.get('nickname');
    if (nickname){
      this.get('userRef').update({'nickname': this.get('nickname')});
      this.set('record_state','Saved');
    }
  },

  insights: function(key, value){
    return this.get('store').find('insight');
  }.property('content'),

  queries: function(key, value){
    return this.get('store').find('myQuery');
  }.property('content')


});
