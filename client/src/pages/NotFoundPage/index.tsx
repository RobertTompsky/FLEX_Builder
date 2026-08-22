import {
  Link,
} from "react-router";

export function NotFoundPage() {
  return (
    <section>
      <h1>404 — PAGE NOT FOUND</h1>

      <Link to="/">
        RETURN HOME
      </Link>
    </section>
  );
}