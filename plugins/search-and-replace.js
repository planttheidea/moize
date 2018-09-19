module.exports = () => ({
  visitor: {
    StringLiteral(path, state) {
      const options = state.opts;

      if (Object.keys(options).length === 0) {
        return;
      }

      Object.keys(options).map((search) => {
        const option = options[search];

        if (path.node.value === search) {
          path.node.value = option;
        }
      });
    },
  },
});
