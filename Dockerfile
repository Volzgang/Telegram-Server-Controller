FROM node:current-alpine3.16
ENV NODE_ENV=production
WORKDIR /root
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 8080
RUN chown -R node /root
USER node
CMD ["npm", "start"]
