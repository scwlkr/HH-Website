# Agent Guidance

Agent Guidance gives automated readers and collaborators accurate HH website context while keeping public discovery separate from repository work instructions.

## Language

**Agent guidance system**:
The complete set of shared facts and audience-specific instructions for agents that index the public website or work within its repository.
_Avoid_: Agent context blob, one public instruction file

**Shared agent context**:
Public-safe business, terminology, service, and route facts used by both internal and external agents.
_Avoid_: Internal instructions, duplicated context

**External agent**:
An automated reader that indexes public content, answers questions, and directs people to appropriate public routes without submitting inquiries or operating private systems.
_Avoid_: Coding agent, site operator

**Internal agent**:
An automated collaborator working with repository context and the applicable project instructions.
_Avoid_: Public crawler, external agent

**Internal agent index**:
A concise map from common repository tasks to their authoritative source, applicable safeguards, and verification commands.
_Avoid_: Replacement manual, duplicated specification

**Agent discovery bundle**:
The cross-linked public guidance, route indexes, and Markdown representations that help external agents understand and navigate the intentionally public HH website.
_Avoid_: Public API platform, crawler facade

**Markdown twin**:
A public Markdown representation of an intentionally indexable HTML page that preserves its meaning and useful links without reproducing its visual interface.
_Avoid_: Internal documentation, separate editorial source

**Public route inventory**:
The canonical list of intentionally indexable HH pages used by human-facing and agent-facing discovery surfaces.
_Avoid_: Every reachable route, private route list
