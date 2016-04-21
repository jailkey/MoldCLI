//!info transpiled
Seed({
		type : "data"
	},
	function(Event){

		var flag = false,
			testModel = false,
			testElement = false;

		describe("Test Mold.Lib.Event", function(){
			var testObject = {};
			
			it("mix events into object", function(){
				Mold.mixin(testObject, new Event(testObject));
				console.log("test")
			});

			it("use methode on and trigger with data", function(done){
				
				testObject.on("test.event", function(e){
					expect(e.data.test).toBe(true)
					done()
				});

				testObject.trigger("test.event", {test : true});
			})
		});
	}
)