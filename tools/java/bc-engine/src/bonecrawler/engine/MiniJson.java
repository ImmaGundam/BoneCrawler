package bonecrawler.engine;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class MiniJson {
  private final String text;
  private int index;

  private MiniJson(String text) {
    this.text = text;
  }

  static Object parse(String text) {
    MiniJson parser = new MiniJson(text);
    Object value = parser.readValue();
    parser.skipWhitespace();
    if (!parser.isAtEnd()) {
      throw parser.error("Unexpected trailing content");
    }
    return value;
  }

  private Object readValue() {
    skipWhitespace();
    if (isAtEnd()) throw error("Unexpected end of JSON");

    return switch (peek()) {
      case '{' -> readObject();
      case '[' -> readArray();
      case '"' -> readString();
      case 't' -> readLiteral("true", Boolean.TRUE);
      case 'f' -> readLiteral("false", Boolean.FALSE);
      case 'n' -> readLiteral("null", null);
      default -> {
        if (peek() == '-' || Character.isDigit(peek())) yield readNumber();
        throw error("Unexpected token '" + peek() + "'");
      }
    };
  }

  private Map<String, Object> readObject() {
    expect('{');
    skipWhitespace();
    Map<String, Object> object = new LinkedHashMap<>();
    if (match('}')) return object;

    while (true) {
      skipWhitespace();
      String key = readString();
      skipWhitespace();
      expect(':');
      Object value = readValue();
      object.put(key, value);
      skipWhitespace();
      if (match('}')) break;
      expect(',');
    }

    return object;
  }

  private List<Object> readArray() {
    expect('[');
    skipWhitespace();
    List<Object> array = new ArrayList<>();
    if (match(']')) return array;

    while (true) {
      array.add(readValue());
      skipWhitespace();
      if (match(']')) break;
      expect(',');
    }

    return array;
  }

  private String readString() {
    expect('"');
    StringBuilder builder = new StringBuilder();

    while (!isAtEnd()) {
      char current = text.charAt(index++);
      if (current == '"') return builder.toString();
      if (current != '\\') {
        builder.append(current);
        continue;
      }

      if (isAtEnd()) throw error("Unterminated escape sequence");
      char escape = text.charAt(index++);
      switch (escape) {
        case '"', '\\', '/' -> builder.append(escape);
        case 'b' -> builder.append('\b');
        case 'f' -> builder.append('\f');
        case 'n' -> builder.append('\n');
        case 'r' -> builder.append('\r');
        case 't' -> builder.append('\t');
        case 'u' -> builder.append(readUnicodeEscape());
        default -> throw error("Invalid escape sequence '\\" + escape + "'");
      }
    }

    throw error("Unterminated string");
  }

  private char readUnicodeEscape() {
    if (index + 4 > text.length()) throw error("Incomplete unicode escape");
    String hex = text.substring(index, index + 4);
    index += 4;
    return (char) Integer.parseInt(hex, 16);
  }

  private Object readLiteral(String literal, Object value) {
    if (!text.startsWith(literal, index)) {
      throw error("Expected " + literal);
    }
    index += literal.length();
    return value;
  }

  private Number readNumber() {
    int start = index;
    if (peek() == '-') index++;
    consumeDigits();

    boolean decimal = false;
    if (!isAtEnd() && peek() == '.') {
      decimal = true;
      index++;
      consumeDigits();
    }

    if (!isAtEnd() && (peek() == 'e' || peek() == 'E')) {
      decimal = true;
      index++;
      if (!isAtEnd() && (peek() == '+' || peek() == '-')) index++;
      consumeDigits();
    }

    String token = text.substring(start, index);
    return decimal ? Double.parseDouble(token) : Long.parseLong(token);
  }

  private void consumeDigits() {
    if (isAtEnd() || !Character.isDigit(peek())) {
      throw error("Expected digit");
    }
    while (!isAtEnd() && Character.isDigit(peek())) {
      index++;
    }
  }

  private void skipWhitespace() {
    while (!isAtEnd() && Character.isWhitespace(peek())) {
      index++;
    }
  }

  private void expect(char expected) {
    if (isAtEnd() || text.charAt(index) != expected) {
      throw error("Expected '" + expected + "'");
    }
    index++;
  }

  private boolean match(char expected) {
    if (isAtEnd() || text.charAt(index) != expected) return false;
    index++;
    return true;
  }

  private char peek() {
    return text.charAt(index);
  }

  private boolean isAtEnd() {
    return index >= text.length();
  }

  private IllegalArgumentException error(String message) {
    return new IllegalArgumentException(message + " at index " + index);
  }
}
