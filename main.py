
def does_unit_match(expr, string):
    return expr[0] == string[0]

def match_expr(expr, string, match_len=0):
    if does_unit_match(expr, string):
        return match_expr


def main():
    expr = "abc"
    string = "abc"
    [matched, match_len] = match_expr(expr, string)
    if matched:
        print(f"match_expr({expr}, {string}) = True")
    else:
        print(f"match_expr({expr}, {string}) = False")
if __name__ == "__main__":
    main()