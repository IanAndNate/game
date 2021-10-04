import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Admin } from "./ui/admin";
import { Game } from "./ui/game";
import { GameRouteProps } from "./ui/game/types";
import { Welcome } from "./ui/welcome";
import styled from "@emotion/styled";
import { Test } from "./ui/game/test";

const Wrapper = styled.div`
    font-family: sans-serif;
    font-size: small;
`;

const App = () => {
    return (
        <Wrapper>
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
                    <Route exact path="/test">
                        <Test />
                    </Route>
                </Switch>
            </BrowserRouter>
        </Wrapper>
    );
};

ReactDOM.render(<App />, document.getElementById("root"));
