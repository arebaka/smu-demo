namespace translit
{
    enum State {
        START, LINE, SPACE, NUM_SIGN_AT_START, NUM_SIGN, AT_SIGN, TILDE, RICH,
        GT_SIGN_AT_START, GT_SIGN, LEFT_SB_AT_START, LEFT_PH, LEFT_PH_AT_START,
        HYPHEN, ZERO, HASHTAG, USER_MENTION, CLUB_MENTION, RIGHT_SB, IMAGE_URI,
        VIDEO_URI, LINK_URI, MUSIC_URI, DOUBLE_HYPHEN
    }

    enum TokenType {
        NL, LINE, RICH_OPEN, RICH_CLOSE, UL_MARKER
    }




    class Token
    {
        private type: TokenType;
        private raw:  string;
    
        public constructor(type: TokenType, raw: string)
        {
            this.type = type;
            this.raw  = raw;
        }
    }




    class Translit
    {
        public static readonly HEADINGS: number = 0b0000000000000001;
        public static readonly HASHTAGS: number = 0b0000000000000010;
        public static readonly MENTIONS: number = 0b0000000000000100;
        public static readonly REPLIES:  number = 0b0000000000001000;
        public static readonly QUOTES:   number = 0b0000000000010000;
        public static readonly RICH:     number = 0b0000000000100000;
        public static readonly MEDIA:    number = 0b0000000001000000;
        public static readonly MUSIC:    number = 0b0000000010000000;
        public static readonly LINKS:    number = 0b0000000100000000;
        public static readonly LISTS:    number = 0b0000001000000000;
        public static readonly HR:       number = 0b0000010000000000;

        public static tokenize(text: string, flags: number)
        {
            var res:          Token[] = [],
                state:        State   = State.START,
                token:        string  = "",
                rich:         string  = "",
                headingLevel: number = 0;

            text += '\n';

            for (let i = 0; i < text.length; i++) {
                let c = text[i];

                switch (state) {

                /// START ///
                case State.START:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.NL, "\n"));
                    break;
                    case ' ':
                        token = c;
                        state = State.LINE;
                    break;
                    case '#':
                        if (flags & this.HEADINGS) {
                            state = State.NUM_SIGN_AT_START;
                            headingLevel = 1;
                        } else if (flags & this.HASHTAGS) {
                            token = c;
                            state = State.NUM_SIGN;
                        } else {
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    case '@':
                        if (flags & this.MENTIONS) {
                            token = c;
                            state = State.AT_SIGN;
                        } else {
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    case '~':
                        if (flags & this.MENTIONS) {
                            token = c;
                            state = State.TILDE;
                        } else if (flags & this.RICH) {
                            rich  = c;
                            state = State.RICH;
                        } else {
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    case '>':
                        if (flags & (this.REPLIES | this.QUOTES)) {
                            state = State.GT_SIGN_AT_START;
                        } else {
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    case '*':
                    case '%':
                    case '_':
                    case '^':
                    case '+':
                    case '&':
                    case '`':
                    case '=':
                        if (flags & this.RICH) {
                            state = State.RICH;
                            rich  = c;
                        } else {
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    case '[':
                        if (flags & this.MEDIA) {
                            state = State.LEFT_SB_AT_START;
                        } else {
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    case ']':
                        if (flags & this.RICH) {
                            state = State.RIGHT_SB;
                        } else {
                            state = State.LINE;
                        }
                    break;
                    case '{':
                        if (flags & (this.MUSIC | this.LINKS)) {
                            state = State.LEFT_PH_AT_START;
                        } else {
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    case '-':
                        if (flags & (this.LISTS | this.HR)) {
                            state = State.HYPHEN;
                        } else {
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    case '0':
                        if (flags & (this.LISTS)) {
                            state = State.ZERO;
                        } else {
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    default:
                        token = c;
                        state = State.LINE;
                    break;
                    }
                break;

                /// LINE ///
                case State.LINE:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.LINE, token));
                        res.push(new Token(TokenType.NL, "\n"));
                        state = State.START;
                    break;
                    case ' ':
                        token += c;
                        state = State.SPACE;
                    break;
                    case '*':
                    case '%':
                    case '_':
                    case '^':
                    case '~':
                    case '+':
                    case '&':
                    case '`':
                    case '=':
                        if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, token));
                            token = c;
                            state = State.RICH;
                            rich  = c;
                        } else {
                            token += c;
                        }
                    break;
                    case ']':
                        if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, token));
                            state = State.RIGHT_SB;
                        } else {
                            token += c;
                        }
                    break;
                    case '{':
                        if (flags & this.LINKS) {
                            res.push(new Token(TokenType.LINE, token));
                            state = State.LEFT_PH;
                        } else {
                            token += c;
                        }
                    break;
                    default:
                        token += c;
                    break;
                    }
                break;

                /// SPACE ///
                case State.SPACE:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.LINE, token));
                        res.push(new Token(TokenType.NL, "\n"));
                        state = State.START;
                    break;
                    case ' ':
                        token += c;
                    break;
                    case '#':
                        if (flags & this.HASHTAGS) {
                            res.push(new Token(TokenType.LINE, token));
                            token = c;
                            state = State.NUM_SIGN;
                        } else {
                            token += c;
                            state = State.LINE;
                        }
                    break;
                    case '@':
                        if (flags & this.MENTIONS) {
                            res.push(new Token(TokenType.LINE, token));
                            token = c;
                            state = State.AT_SIGN;
                        } else {
                            token += c;
                            state = State.LINE;
                        }
                    break;
                    case '~':
                        if (flags & this.MENTIONS) {
                            state = State.TILDE;
                        } else if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, token));
                            token = c;
                            state = State.RICH;
                            rich  = c;
                        } else {
                            token += c;
                            state = State.LINE;
                        }
                    break;
                    case '>':
                        if (flags & (this.REPLIES)) {
                            res.push(new Token(TokenType.LINE, token));
                            token = c;
                            state = State.GT_SIGN;
                        } else {
                            token += c;
                            state = State.LINE;
                        }
                    break;
                    case '*':
                    case '%':
                    case '_':
                    case '^':
                    case '+':
                    case '&':
                    case '`':
                    case '=':
                        if (flags & this.RICH) {
                            state = State.RICH;
                            rich  = c;
                        } else {
                            token += c;
                            state = State.LINE;
                        }
                    break;
                    case '{':
                        if (flags & (this.MUSIC | this.LINKS)) {
                            state = State.LEFT_PH;
                        } else {
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    default:
                        token += c;
                        state = State.LINE;
                    break;
                    }
                break;

                /// NUM SIGN AT START ///
                case State.NUM_SIGN_AT_START:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.LINE, "#".repeat(headingLevel)));
                        res.push(new Token(TokenType.NL, "\n"));
                        state = State.START;
                    break;
                    case ' ':
                        token = "#".repeat(headingLevel) + c;
                        state = State.SPACE;
                    break;
                    case '#':
                        if (headingLevel > 5) {
                            token = "#######";
                            state = State.LINE;
                        } else {
                            headingLevel++;
                        }
                    break;
                    case '@':
                    case '>':
                    case '[':
                    case ']':
                    case '-':
                    case '"':
                    case '¤':
                    case '§':
                    case ':':
                    case '|':
                    case '<':
                    case '}':
                    case '∞':
                    case '!':
                    case '–':
                    case '/':
                    case ';':
                    case ',':
                    case '.':
                    case '=':
                    case '?':
                    case '(':
                    case ')':
                    case '¬':
                        token = "#".repeat(headingLevel) + c;
                        state = State.LINE;
                    break;
                    case '*':
                    case '%':
                    case '_':
                    case '^':
                    case '~':
                    case '+':
                    case '&':
                    case '`':
                    case '=':
                        if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, "#".repeat(headingLevel)));
                            state = State.RICH;
                            rich  = c;
                        } else {
                            token = "#".repeat(headingLevel) + c;
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    case '{':
                        if (flags & this.LINKS) {
                            state = State.LEFT_PH;
                        } else {
                            token = "#".repeat(headingLevel) + c;
                            state = State.LINE;
                        }
                    break;
                    default:
                        if (headingLevel == 1) {
                            token = "#" + c;
                            state = State.HASHTAG;
                        } else {
                            token = "#".repeat(headingLevel) + c;
                            state = State.LINE;
                        }
                    break;
                    }
                break;

                /// NUM SIGN ///
                case State.NUM_SIGN:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.LINE, "#"));
                        res.push(new Token(TokenType.NL, "\n"));
                        state = State.START;
                    break;
                    case ' ':
                        token = "#" + c;
                        state = State.SPACE;
                    break;
                    case '#':
                        token = "##";
                        state = State.LINE;
                    break;
                    case '@':
                    case '>':
                    case '[':
                    case ']':
                    case '-':
                    case '"':
                    case '¤':
                    case '§':
                    case ':':
                    case '|':
                    case '<':
                    case '}':
                    case '∞':
                    case '!':
                    case '–':
                    case '/':
                    case ';':
                    case ',':
                    case '.':
                    case '=':
                    case '?':
                    case '(':
                    case ')':
                    case '¬':
                        token = "#" + c;
                        state = State.LINE;
                    break;
                    case '*':
                    case '%':
                    case '_':
                    case '^':
                    case '~':
                    case '+':
                    case '&':
                    case '`':
                    case '=':
                        if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, "#"));
                            state = State.RICH;
                            rich  = c;
                        } else {
                            token = "#" + c;
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    case '{':
                        if (flags & this.LINKS) {
                            state = State.LEFT_PH;
                        } else {
                            token = "#" + c;
                            state = State.LINE;
                        }
                    break;
                    default:
                        if (headingLevel == 1) {
                            token = "#" + c;
                            state = State.HASHTAG;
                        } else {
                            token = "#" + c;
                            state = State.LINE;
                        }
                    break;
                    }
                break;

                /// AT SIGN ///
                case State.AT_SIGN:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.LINE, "@"));
                        res.push(new Token(TokenType.NL, "\n"));
                        state = State.START;
                    break;
                    case ' ':
                        token = "@" + c;
                        state = State.SPACE;
                    break;
                    case '@':
                        token = "@@";
                        state = State.LINE;
                    break;
                    case '#':
                    case '>':
                    case '[':
                    case ']':
                    case '-':
                    case '"':
                    case '¤':
                    case '§':
                    case ':':
                    case '|':
                    case '<':
                    case '}':
                    case '∞':
                    case '!':
                    case '–':
                    case '/':
                    case ';':
                    case ',':
                    case '.':
                    case '=':
                    case '?':
                    case '(':
                    case ')':
                    case '¬':
                        token = "@" + c;
                        state = State.LINE;
                    break;
                    case '*':
                    case '%':
                    case '_':
                    case '^':
                    case '~':
                    case '+':
                    case '&':
                    case '`':
                    case '=':
                        if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, "@"));
                            state = State.RICH;
                            rich  = c;
                        } else {
                            token = "@" + c;
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    case '{':
                        if (flags & this.LINKS) {
                            state = State.LEFT_PH;
                        } else {
                            token = "@" + c;
                            state = State.LINE;
                        }
                    break;
                    default:
                        if (flags & this.MENTIONS) {
                            token = "@" + c;
                            state = State.USER_MENTION;
                        } else {
                            token = "@" + c;
                            state = State.LINE;
                        }
                    break;
                    }
                break;

                /// TILDE ///
                case State.TILDE:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.LINE, "~"));
                        res.push(new Token(TokenType.NL, "\n"));
                        state = State.START;
                    break;
                    case ' ':
                        token = "~" + c;
                        state = State.SPACE;
                    break;
                    case '#':
                    case '@':
                    case '>':
                    case ']':
                    case '-':
                    case '"':
                    case '¤':
                    case '§':
                    case ':':
                    case '|':
                    case '<':
                    case '}':
                    case '∞':
                    case '!':
                    case '–':
                    case '/':
                    case ';':
                    case ',':
                    case '.':
                    case '=':
                    case '?':
                    case '(':
                    case ')':
                    case '¬':
                        token = "@" + c;
                        state = State.LINE;
                    break;
                    case '*':
                    case '%':
                    case '_':
                    case '^':
                    case '~':
                    case '+':
                    case '&':
                    case '`':
                    case '=':
                        if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, "~"));
                            state = State.RICH;
                            rich  = c;
                        } else {
                            token = "~" + c;
                            token = c;
                            state = State.LINE;
                        }
                    break;
                    case '{':
                        if (flags & this.LINKS) {
                            state = State.LEFT_PH;
                        } else {
                            token = "~" + c;
                            state = State.LINE;
                        }
                    break;
                    default:
                        if (flags & this.MENTIONS) {
                            token = "~" + c;
                            state = State.CLUB_MENTION;
                        } else {
                            token = "~" + c;
                            state = State.LINE;
                        }
                    break;
                    }
                break;

                /// RICH ///
                case State.RICH:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.LINE, token));
                        res.push(new Token(TokenType.NL, "\n"));
                        state = State.START;
                    break;
                    case ' ':
                        token += c;
                        state = State.SPACE;
                    break;
                    case '*':
                    case '%':
                    case '_':
                    case '^':
                    case '~':
                    case '+':
                    case '&':
                    case '`':
                    case '=':
                        res.push(new Token(TokenType.LINE, token));
                        token = c;
                    break;
                    case '[':
                        res.push(new Token(TokenType.RICH_OPEN, rich + c));
                        state = State.SPACE;
                    break;
                    case '{':
                        res.push(new Token(TokenType.LINE, token));
                        state = State.LEFT_PH;
                    break;
                    default:
                        token += c;
                        state = State.LINE;
                    break;
                    }
                break;

                /// LEFT SB AT START ///
                case State.LEFT_SB_AT_START:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.LINE, "["));
                        res.push(new Token(TokenType.NL, "\n"));
                        state = State.START;
                    break;
                    case ' ':
                        token = "[" + c;
                        state = State.SPACE;
                    break;
                    case '#':
                        res.push(new Token(TokenType.LINE, "["));
                        token = c;
                        state = State.NUM_SIGN;
                    break;
                    case '@':
                        res.push(new Token(TokenType.LINE, "["));
                        token = c;
                        state = State.AT_SIGN;
                    break;
                    case '~':
                        if (flags & this.MENTIONS) {
                            res.push(new Token(TokenType.LINE, "["));
                            token = c;
                            state = State.TILDE;
                        } else if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, "["));
                            rich  = c;
                            state = State.RICH;
                        } else {
                            token = "[" + c;
                            state = State.LINE;
                        }
                    break;
                    case '>':
                        if (flags & this.REPLIES) {
                            res.push(new Token(TokenType.LINE, "["));
                            token = c;
                            state = State.GT_SIGN;
                        } else {
                            token = "[" + c;
                            state = State.LINE;
                        }
                    break;
                    case '*':
                    case '%':
                    case '_':
                    case '^':
                    case '+':
                    case '&':
                    case '`':
                    case '=':
                        if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, "["));
                            rich = c;
                            state = State.RICH;
                        } else {
                            token = "[" + c;
                            state = State.LINE;
                        }
                    break;
                    case '[':
                        if (flags & this.MEDIA) {
                            state = State.IMAGE_URI;
                        } else {
                            res.push(new Token(TokenType.LINE, "["));
                            state = State.SPACE;
                        }
                    break;
                    case '{':
                        if (flags & this.MEDIA) {
                            state = State.VIDEO_URI;
                        } else {
                            res.push(new Token(TokenType.LINE, "["));
                            state = State.LEFT_PH;
                        }
                    break;
                    default:
                        token = "[" + c;
                        state = State.LINE;
                    break;
                    }
                break;

                /// LEFT PH ///
                case State.LEFT_PH:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.LINE, "{"));
                        res.push(new Token(TokenType.NL, "\n"));
                        state = State.START;
                    break;
                    case ' ':
                        token = "{" + c;
                        state = State.SPACE;
                    break;
                    case '#':
                        res.push(new Token(TokenType.LINE, "{"));
                        token = c;
                        state = State.NUM_SIGN;
                    break;
                    case '@':
                        res.push(new Token(TokenType.LINE, "{"));
                        token = c;
                        state = State.AT_SIGN;
                    break;
                    case '~':
                        if (flags & this.MENTIONS) {
                            res.push(new Token(TokenType.LINE, "{"));
                            token = c;
                            state = State.TILDE;
                        } else if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, "{"));
                            rich  = c;
                            state = State.RICH;
                        } else {
                            token = "{" + c;
                            state = State.LINE;
                        }
                    break;
                    case '>':
                        if (flags & this.REPLIES) {
                            res.push(new Token(TokenType.LINE, "{"));
                            token = c;
                            state = State.GT_SIGN;
                        } else {
                            token = "{" + c;
                            state = State.LINE;
                        }
                    break;
                    case '*':
                    case '%':
                    case '_':
                    case '^':
                    case '+':
                    case '&':
                    case '`':
                    case '=':
                        if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, "{"));
                            rich = c;
                            state = State.RICH;
                        } else {
                            token = "{" + c;
                            state = State.LINE;
                        }
                    break;
                    case '[':
                        token = "{" + c;
                        state = State.SPACE;
                    break;
                    case '{':
                        state = State.LINK_URI;
                    break;
                    default:
                        token = "{" + c;
                        state = State.LINE;
                    break;
                    }
                break;

                /// LEFT PH AT START ///
                case State.LEFT_PH_AT_START:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.LINE, "{"));
                        res.push(new Token(TokenType.NL, "\n"));
                        state = State.START;
                    break;
                    case ' ':
                        token = "{" + c;
                        state = State.SPACE;
                    break;
                    case '#':
                        res.push(new Token(TokenType.LINE, "{"));
                        token = c;
                        state = State.NUM_SIGN;
                    break;
                    case '@':
                        res.push(new Token(TokenType.LINE, "{"));
                        token = c;
                        state = State.AT_SIGN;
                    break;
                    case '~':
                        if (flags & this.MENTIONS) {
                            res.push(new Token(TokenType.LINE, "{"));
                            token = c;
                            state = State.TILDE;
                        } else if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, "{"));
                            rich  = c;
                            state = State.RICH;
                        } else {
                            token = "{" + c;
                            state = State.LINE;
                        }
                    break;
                    case '>':
                        if (flags & this.REPLIES) {
                            res.push(new Token(TokenType.LINE, "{"));
                            token = c;
                            state = State.GT_SIGN;
                        } else {
                            token = "{" + c;
                            state = State.LINE;
                        }
                    break;
                    case '*':
                    case '%':
                    case '_':
                    case '^':
                    case '+':
                    case '&':
                    case '`':
                    case '=':
                        if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, "{"));
                            rich = c;
                            state = State.RICH;
                        } else {
                            token = "{" + c;
                            state = State.LINE;
                        }
                    break;
                    case '[':
                        if (flags & this.MUSIC) {
                            state = State.MUSIC_URI;
                        } else {
                            token = "{" + c;
                            state = State.SPACE;
                        }
                    break;
                    case '{':
                        state = State.LINK_URI;
                    break;
                    default:
                        token = "{" + c;
                        state = State.LINE;
                    break;
                    }
                break;

                /// RIGHT SB ///
                case State.RIGHT_SB:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.LINE, "]"));
                        res.push(new Token(TokenType.NL, "\n"));
                        state = State.START;
                    break;
                    case ' ':
                        token = "]" + c;
                        state = State.SPACE;
                    break;
                    case '#':
                        res.push(new Token(TokenType.LINE, "]"));
                        token = c;
                        state = State.NUM_SIGN;
                    break;
                    case '@':
                        res.push(new Token(TokenType.LINE, "]"));
                        token = c;
                        state = State.AT_SIGN;
                    break;
                    case '~':
                        if (flags & this.RICH) {
                            res.push(new Token(TokenType.RICH_CLOSE, "]" + c));
                        } else {
                            token = "]" + c;
                        }
                        state = State.LINE;
                    break;
                    case '>':
                        if (flags & this.REPLIES) {
                            res.push(new Token(TokenType.LINE, "]"));
                            token = c;
                            state = State.GT_SIGN;
                        } else {
                            token = "]" + c;
                            state = State.LINE;
                        }
                    break;
                    case '*':
                    case '%':
                    case '_':
                    case '^':
                    case '+':
                    case '&':
                    case '`':
                    case '=':
                        if (flags & this.RICH) {
                            res.push(new Token(TokenType.RICH_CLOSE, "]" + c));
                        } else {
                            token = "]" + c;
                        }
                        state = State.LINE;
                    break;
                    case '[':
                    case '{':
                    case '}':
                        token = "]" + c;
                        state = State.SPACE;
                    break;
                    case ']':
                        res.push(new Token(TokenType.LINE, "]"));
                    break;
                    default:
                        token = "]" + c;
                        state = State.LINE;
                    break;
                    }
                break;

                /// HYPHEN ///
                case State.HYPHEN:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.LINE, "-"));
                        res.push(new Token(TokenType.NL, "\n"));
                        state = State.START;
                    break;
                    case ' ':
                        res.push(new Token(TokenType.UL_MARKER, "- "));
                        state = State.START;
                    break;
                    case '#':
                        res.push(new Token(TokenType.LINE, "-"));
                        token = c;
                        state = State.NUM_SIGN;
                    break;
                    case '@':
                        res.push(new Token(TokenType.LINE, "-"));
                        token = c;
                        state = State.AT_SIGN;
                    break;
                    case '~':
                        if (flags & this.MENTIONS) {
                            res.push(new Token(TokenType.LINE, "-"));
                            token = c;
                            state = State.TILDE;
                        } else if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, "-"));
                            rich  = c;
                            state = State.RICH;
                        } else {
                            token = "-" + c;
                            state = State.LINE;
                        }
                    break;
                    case '>':
                        if (flags & this.REPLIES) {
                            res.push(new Token(TokenType.LINE, "-"));
                            token = c;
                            state = State.GT_SIGN;
                        } else {
                            token = "-" + c;
                            state = State.LINE;
                        }
                    break;
                    case '*':
                    case '%':
                    case '_':
                    case '^':
                    case '+':
                    case '&':
                    case '`':
                    case '=':
                        if (flags & this.RICH) {
                            res.push(new Token(TokenType.LINE, "-"));
                            rich = c;
                            state = State.RICH;
                        } else {
                            token = "-" + c;
                            state = State.LINE;
                        }
                    break;
                    case '[':
                        token = "-" + c;
                        state = State.SPACE;
                    break;
                    case '{':
                        res.push(new Token(TokenType.LINE, "-"));
                        state = State.LEFT_PH;
                    break;
                    case '-':
                        token = "--";
                        state = State.DOUBLE_HYPHEN;
                    break;
                    default:
                        token = "-" + c;
                        state = State.LINE;
                    break;
                    }
    
                break;

                /// ZERO ///
                case State.ZERO:
                    switch (c) {
                    case '\n':
                        res.push(new Token(TokenType.LINE, "0"));
                        res.push(new Token(TokenType.NL, "\n"));
                        state = State.START;
                    break;
                    case ' ':
                        token = "0" + c;
                        state = State.LINE;
                    break;
                    }
                break;

                /// GT SIGN AT START ///
                case State.GT_SIGN_AT_START:
                break;

                /// GT SIGN ///
                case State.GT_SIGN:
                break;

                /// HASHTAG ///
                case State.HASHTAG:
                break;

                /// USER MENTION ///
                case State.USER_MENTION:
                break;

                /// CLUB MENTION ///
                case State.CLUB_MENTION:
                break;

                /// IMAGE URI ///
                case State.IMAGE_URI:
                break;

                /// VIDEO URI ///
                case State.VIDEO_URI:
                break;

                /// LINK URI ///
                case State.LINK_URI:
                break;

                /// MUSIC URI ///
                case State.MUSIC_URI:
                break;

                /// DOUBLE HYPHEN ///
                case State.DOUBLE_HYPHEN:
                break;
                }
            }
        }
    }    
}
