FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go test ./... && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /laudotech-api ./cmd/api

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata && adduser -D -H laudotech
USER laudotech
ENV TZ=America/Sao_Paulo PORT=8080
COPY --from=build /laudotech-api /laudotech-api
EXPOSE 8080
ENTRYPOINT ["/laudotech-api"]
