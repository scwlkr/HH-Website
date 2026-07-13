export function load(url, context, nextLoad) {
  if (url.endsWith(".module.css")) {
    return {
      format: "module",
      shortCircuit: true,
      source:
        "const styles = new Proxy({}, { get: (_target, property) => String(property) }); export default styles;",
    };
  }

  return nextLoad(url, context);
}
