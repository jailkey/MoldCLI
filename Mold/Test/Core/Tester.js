//!info transpiled
Seed({
		type : "data"
	},
	function(Tester){
		//Use the Jasmin specs for testing the testtool
		//http://jasmine.github.io/2.2/introduction.html
		describe("test Mold.Lib.Tester", function(){

			describe("A suite", function() {
				it("contains spec with an expectation", function() {
					expect(true).toBe(true);
				});
			});

			describe("A suite is just a function", function() {
				var a;

				it("and so is a spec", function() {
					a = true;
					expect(a).toBe(true);
				});
			});


			describe("The 'toBe' matcher compares with ===", function() {
				it("and has a positive case", function() {
					expect(true).toBe(true);
				});


				it("and can have a negative case", function() {
					expect(false).not.toBe(true);
				});
			});

			describe("Included matchers:", function() {

				it("The 'toBe' matcher compares with ===", function() {
					var a = 12;
					var b = a;

					expect(a).toBe(b);
					expect(a).not.toBe(null);
				});

				describe("The 'toEqual' matcher", function() {

					it("works for simple literals and variables", function() {
						var a = 12;
						expect(a).toEqual(12);
					});

					it("should work for objects", function() {
						var foo = {
							a: 12,
							b: 34
						};
						var bar = {
							a: 12,
							b: 34
						};
						expect(foo).toEqual(bar);
					});
				});

				it("The 'toMatch' matcher is for regular expressions", function() {
					var message = "foo bar baz";

					expect(message).toMatch(/bar/);
					expect(message).toMatch("bar");
					expect(message).not.toMatch(/quux/);
				});

				it("The 'toBeDefined' matcher compares against `undefined`", function() {
					var a = {
					  foo: "foo"
					};

					expect(a.foo).toBeDefined();
					expect(a.bar).not.toBeDefined();
				});

				it("The `toBeUndefined` matcher compares against `undefined`", function() {
					var a = {
					  foo: "foo"
					};

					expect(a.foo).not.toBeUndefined();
					expect(a.bar).toBeUndefined();
				});

				it("The 'toBeNull' matcher compares against null", function() {
					var a = null;
					var foo = "foo";

					expect(null).toBeNull();
					expect(a).toBeNull();
					expect(foo).not.toBeNull();
				});

				it("The 'toBeTruthy' matcher is for boolean casting testing", function() {
					var a, foo = "foo";

					expect(foo).toBeTruthy();
					expect(a).not.toBeTruthy();
				});

				it("The 'toBeFalsy' matcher is for boolean casting testing", function() {
					var a, foo = "foo";

					expect(a).toBeFalsy();
					expect(foo).not.toBeFalsy();
				});

				it("The 'toContain' matcher is for finding an item in an Array", function() {
					var a = ["foo", "bar", "baz"];

					expect(a).toContain("bar");
					expect(a).not.toContain("quux");
				});

				it("The 'toBeLessThan' matcher is for mathematical comparisons", function() {
					var pi = 3.1415926,
					 	e = 2.78;

					expect(e).toBeLessThan(pi);
					expect(pi).not.toBeLessThan(e);
				});

				it("The 'toBeGreaterThan' matcher is for mathematical comparisons", function() {
					var pi = 3.1415926,
						e = 2.78;

					expect(pi).toBeGreaterThan(e);
					expect(e).not.toBeGreaterThan(pi);
				});

				it("The 'toBeCloseTo' matcher is for precision math comparison", function() {
					var pi = 3.1415926,
						e = 2.78;

					expect(pi).toBeCloseTo(e, 2);
					expect(pi).not.toBeCloseTo(e, 0);
				});

				it("The 'toThrow' matcher is for testing if a function throws an exception", function() {
					var foo = function() {
					 	return 1 + 2;
					};
					var bar = function() {
					 	return a + 1;
					};

					expect(foo).not.toThrow();

					expect(bar).toThrow();
				});

				it("The 'toThrowError' matcher is for testing a specific thrown exception", function() {
					var foo = function() {
					  throw new TypeError("foo bar baz");
					};

					expect(foo).toThrowError("foo bar baz");
					expect(foo).toThrowError(/bar/);
					expect(foo).toThrowError(TypeError);
					expect(foo).toThrowError(TypeError, "foo bar baz");
				});
			});

			describe("A spec", function() {
				it("is just a function, so it can contain any code", function() {
					var foo = 0;
					foo += 1;

					expect(foo).toEqual(1);
				});

				it("can have more than one expectation", function() {
					var foo = 0;
					foo += 1;

					expect(foo).toEqual(1);
					expect(true).toEqual(true);
				});
			});

			describe("A spec using beforeEach and afterEach", function() {
				var foo = 0;

				beforeEach(function() {
					foo += 1;
				});

				afterEach(function() {
					foo = 0;
				});

				it("is just a function, so it can contain any code", function() {
				
				});

				it("can have more than one expectation", function() {
					expect(foo).toEqual(1);
					expect(true).toEqual(true);
				});
			});

			describe("A spec using before and after", function() {
				var foo;

				before(function() {
					foo = 1;
				});

				after(function() {
					foo = 0;
				});

				it("sets the initial value of foo before specs run", function() {
					expect(foo).toEqual(1);
					foo += 1;
				});

				it("does not reset foo between specs", function() {
					expect(foo).toEqual(2);
				});
			});


			describe("A spec", function() {

				beforeEach(function() {
					this.foo = 0;
				});

				it("can use the `this` to share state", function() {
					expect(this.foo).toEqual(0);
					this.bar = "test pollution?";
				});
			});


			describe("A spec", function() {
				var foo;

				beforeEach(function() {
					foo = 0;
					foo += 1;
				});

				afterEach(function() {
					foo = 0;
				});

				it("is just a function, so it can contain any code", function() {
					expect(foo).toEqual(1);
				});

				it("can have more than one expectation", function() {
					expect(foo).toEqual(1);
					expect(true).toEqual(true);
				});

				describe("nested inside a second describe", function() {
					var bar;

					beforeEach(function() {
						bar = 1;
					});

					it("can reference both scopes as needed", function() {
						expect(foo).toEqual(bar);
					});
				});
			});


			xdescribe("A spec", function() {
				var foo;

				beforeEach(function() {
					foo = 0;
					foo += 1;
				});

				it("is just a function, so it can contain any code", function() {
					expect(foo).toEqual(1);
				});
			});


			describe("A spy", function() {
				var foo, bar = null;

				beforeEach(function() {
					foo = {
						setBar: function(value) {
							bar = value;
						}
						
					};

					spyOn(foo, 'setBar');
					foo.setBar(123);
					foo.setBar(456, 'another param');
				});

				it("tracks that the spy was called", function() {
					expect(foo.setBar).toHaveBeenCalled();
				});

				it("tracks all the arguments of its calls", function() {
					expect(foo.setBar).toHaveBeenCalledWith(123);
					expect(foo.setBar).toHaveBeenCalledWith(456, 'another param');
				});

				it("stops all execution on a function", function() {
					expect(bar).not.toBeNull();
				});
			});
		});
	}
);
	
