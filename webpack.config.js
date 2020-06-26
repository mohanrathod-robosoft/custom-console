var path = require('path');

module.exports = {
   entry: {
      app: './index.ts'
   },
   output: {
      filename: 'main_bundle.js'
   },
   mode:'development',
   resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"]
  },
   module: {
      rules: [
         {
            test:/\.(js)$/,
            loader: 'babel-loader',
            query: {
               presets: ['@babel/preset-env']
            }
         },
         { 
            test: /\.tsx?$/, 
            loader: "ts-loader" },
         {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader'],
          },
      ]
   }
};