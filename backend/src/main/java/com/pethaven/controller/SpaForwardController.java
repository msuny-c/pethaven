package com.pethaven.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping("/")
    public String root() {
        return "forward:/index.html";
    }

    @GetMapping(value = {
            "/{path:^(?!api|ws|swagger-ui|v3|api-docs|assets)[^\\.]*}",
            "/{path:^(?!api|ws|swagger-ui|v3|api-docs|assets)[^\\.]*}/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
