var cons = function (a, b) {
  return (function (o) {
    return (function (x) {
      return (function (x) {
        return (function (x) {
          return o;
        })((o["cdr"] = b));
      })((o["car"] = a));
    })((o["type"] = "pair"));
  })({});
};
var car = function (p) {
  return p["car"];
};
var cdr = function (p) {
  return p["cdr"];
};
var eqp = function (a, b) {
  return a == b;
};
var istypep = function (x, type) {
  return "type" in x && eqp(o["type"], type);
};
var pairp = function (x) {
  return istypep(x, "pair");
};
var nullp = function (x) {
  return eqp(x, null);
};
var listp = function (x) {
  return nullp(x) || (pairp(x) && listp(cdr(x)));
};
var reverse_help = function (t, res) {
  return nullp(t) ? res : reverse_help(cdr(t), cons(car(t), res));
};
var reverse = function (t) {
  return reverse_help(t, null);
};
var length = function (t) {
  return nullp(t) ? 0 : plus(1, length(cdr(t)));
};
var not = function (x) {
  return x ? false : true;
};
var plus = function (a, b) {
  return a + b;
};
var _ = function (a, b) {
  return a - b;
};
var star = function (a, b) {
  return a * b;
};
var fslash = function (a, b) {
  return a / b;
};
var modulo = function (a, b) {
  return a % b;
};
var eq = function (a, b) {
  return a == b;
};
var zerop = function (n) {
  return eq(n, 0);
};
var displayln = function (x) {
  return console["log"](x);
};
var ormap = function (f, t) {
  return not(nullp(t)) && (f(car(t)) || ormap(f, cdr(t)));
};
var generate_primes_help = function (primes, num_primes, i) {
  return eq(length(primes), num_primes)
    ? primes
    : generate_primes_help(
        ormap(function (prime) {
          return zerop(modulo(i, prime));
        }, primes)
          ? primes
          : cons(i, primes),
        num_primes,
        plus(i, 1)
      );
};
var generate_primes = function (num) {
  return reverse(generate_primes_help(null, num, 2));
};
var by_id = function (id) {
  return document["getElementById"](id);
};
var set_on_clickbang = function (elem, f) {
  return (elem["onclick"] = f);
};
var _gtstring = function (i) {
  return "" + i;
};
var string_append = function (a, b) {
  return a + b;
};
var generate_output = function (t) {
  return nullp(t)
    ? ""
    : nullp(cdr(t))
    ? car(t)
    : string_append(
        _gtstring(car(t)),
        string_append(", ", generate_output(cdr(t)))
      );
};
var run = function () {
  return (by_id("o")["innerHTML"] = generate_output(
    generate_primes(parseInt(by_id("n")["value"]))
  ));
};
set_on_clickbang(by_id("b"), run);
