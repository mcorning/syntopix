const { isEmpty } = require('../../../utils/helpers');

const { ask,  } = require('./readline'); // Import ask
const {
  displaySpaces,
  getSpaces,
  getSpaceTopics,
  deleteSpace,
} = require('../spaceMan'); // Import displaySpaces


function deleteMySpace(keysMan) {
  const { pkSpacesKey, pk } = keysMan;

  // console.log('deleteSpace for key:>> ', pkSpacesKey);
  return getSpaces(pkSpacesKey)
    .then((spaces) => {
      if (isEmpty(spaces)) {
        console.log('You have no Spaces yet');
        // pause().then(() => {
          throw new Error('Invalid action');
        // });
      } else {
        // if (spaces.length === 1) {
        //   console.log('\nYour first Space is ', spaces[0]);
        // } else {
        console.log(`\nAuthor ${pk}'s Spaces:`);
        console.table(spaces);
        console.log('\n');
        // }
      }
      return spaces;
    })
    .then((spaces) => {
      return ask('Pick a Space to delete').then((selection) => {
        deleteSpace(pkSpacesKey, spaces[Number(selection)]);
      });
    });
}

function spaceTopics(keysMan) {
  const { spaceKey, topicContentKey } = keysMan;
  return new Promise((resolve, reject) => {
    function pickFromSpaces({ spaces,  }) {
      if (spaces.length > 1) {
        return ask('Pick a Space: ').then(
          (spaceIndex) => spaces[parseInt(spaceIndex, 10)]
        );
      }
      return spaces[0];
    }

    function renderSpaceTopics({ space, topics }) {
      if (isEmpty(space)) {
        return
      } else {
        console.log('\nSpace', space, 'holds:');
        console.table(
          topics.map((v) => {
            return { 'Topiq ID': v.id, 'Topiq Title': v.value.title };
          })
        );
        console.log('\n');
        resolve();
      }
    }

    return displaySpaces(keysMan)
      .then(({ spaces,  }) => pickFromSpaces({ spaces,  }))
      .then((space) => getSpaceTopics({ space, spaceKey, topicContentKey }))
      .then((results) => renderSpaceTopics(results))
      .catch((err) => {
        console.error('Error fetching topiqs for space:', err);
        reject(err); // Reject the promise on error
      });

  });
}

module.exports = { deleteMySpace, spaceTopics };
