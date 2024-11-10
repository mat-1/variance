## Builder
FROM node:20-alpine as builder

WORKDIR /src

COPY . /src/
RUN corepack enable && yarn install
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN yarn build


## App
FROM nginx:1.23.3-alpine

COPY --from=builder /src/dist /app

RUN rm -rf /usr/share/nginx/html \
  && ln -s /app /usr/share/nginx/html
