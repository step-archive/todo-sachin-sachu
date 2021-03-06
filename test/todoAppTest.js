const chai=require('chai');
const assert=chai.assert;

const User=require('../scripts/models/user.js');
const TodoApp=require('../scripts/models/todoApp.js');

describe('TodoApp',()=>{
  beforeEach(()=>{
    App=new TodoApp('./test/testData/testData.json');
    App.loadData();
  })

  describe('# isValidUser()',()=>{
    it("should return true for valid user",()=>{
      assert.isOk(App.isValidUser("john","john"));
    })
    it("should return false for invalid user",()=>{
      assert.isNotOk(App.isValidUser("badUser","badPassword"));
    })
  })

  describe('# addSessionIdTo',()=>{
    it("should add sessionId to the valid user",()=>{
      App.addSessionIdTo('john',1001);
      assert.equal(App.allUsers['john'].sessionId,1001);
    })
    it("should not add sessionId to the invalid user",()=>{
      App.addSessionIdTo('badUser',1001);
      assert.isUndefined(App.allUsers['badUser']);
    })
  })

  describe('# getUserBySessionId()',()=>{
    it('should return specific user for valid sessionId',()=>{
      App.addSessionIdTo('john',1001);
      let expectedUser=new User('john','john','john');
      let fnOutput = App.getUserBySessionId(1001);
      assert.instanceOf(fnOutput,User);
      assert.propertyVal(fnOutput,'name',"john");
      assert.propertyVal(fnOutput,'userId',"john");
      assert.propertyVal(fnOutput,'password',"john");
      assert.propertyVal(fnOutput,'sessionId',1001);
    })
    it('should return undefined for invalid sessionId',()=>{
      let badSessionId = 1;
      assert.isUndefined(App.getUserBySessionId(badSessionId));
    })
  })
})
