const preamble = /^tqr:\w{2}/;

const contactOwner = /vcf:\d{13}-\d*/;
const contactNickname = /@?\w+$/;

const getCountry = (contactKey) => {
  return contactKey.match(preamble);
};
const getContactOwner = (contactKey) => {
  return contactKey.match(contactOwner);
};
const getContactNickname = (contactKey) => {
  return contactKey.match(contactNickname);
};

const key = 'tqr:lo:vcf:1670971711281-0:@home';

const country = getCountry(key);
const owner = getContactOwner(key);
const nickName = getContactNickname(key);

console.log(country);
console.log(owner[0]);
console.log(nickName[0]);
