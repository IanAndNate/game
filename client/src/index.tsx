import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Admin } from "./ui/admin";
import { Game } from "./ui/game";
import { GameRouteProps } from "./ui/game/types";
import { Welcome } from "./ui/welcome";
import { css, Global } from '@emotion/react';

const GlobalStyles = () => <Global styles={css`
    body {
        margin: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
    }
    #root {
        font-family: sans-serif;
        font-size: small;
        margin: 0 8px;
        width: 100%;
        height: 100%;
    }
`}/>

const App = () => {
    return (
        <>
            <GlobalStyles />
            <BrowserRouter>
                <Switch>
                    <Route exact path="/">
                        <Welcome />
                    </Route>
                    <Route
                        exact
                        path="/game/:roomId"
                        render={(routeProps: GameRouteProps) => (
                            <Game {...routeProps} />
                        )}
                    />
                    <Route exact path="/admin">
                        <Admin />
                    </Route>
                </Switch>
            </BrowserRouter>
        </>
    );
};

ReactDOM.render(<App />, document.getElementById("root"));

if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(function () {
            console.log("Service Worker Registered");
        });
}

navigator.serviceWorker.addEventListener('message', event => {
    console.log(event);
});

navigator.serviceWorker.controller.postMessage("hullo");