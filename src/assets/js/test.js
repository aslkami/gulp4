const fate = 'fate'
function stay() {
  return 123
}
const obj = {
  name: 'saber',
  age: '18'
}
const proxy = new Proxy(obj, () => {
  console.log(obj)
})


console.log(stay())