package aurora.application.action;

import javax.script.ScriptException;

import uncertain.composite.CompositeMap;
import uncertain.ocm.IObjectRegistry;
import uncertain.ocm.OCManager;
import uncertain.proc.AbstractEntry;
import uncertain.proc.ProcedureRunner;
import aurora.application.script.engine.InterruptException;
import aurora.application.script.engine.ScriptRunner;

public class ServerScript extends AbstractEntry {
	String jsimport;
	String exp = null;
	String resultpath = null;
	String cdata = null;
	String optimizeLevel = null;

	int lineno = -1;
	private IObjectRegistry registry;

	public ServerScript(OCManager oc_manager, IObjectRegistry registry) {
		this.registry = registry;
	}

	public String getResultpath() {
		return resultpath;
	}

	public void setResultpath(String resultpath) {
		this.resultpath = resultpath;
	}

	public String getExp() {
		return exp;
	}

	public void setExp(String exp) {
		this.exp = exp;
	}

	public String getImport() {
		return jsimport;
	}

	public void setImport(String import1) {
		jsimport = import1;
	}

	public String getOptimizeLevel() {
		return optimizeLevel;
	}

	public void setOptimizeLevel(String optimizeLevel) {
		this.optimizeLevel = optimizeLevel;
	}

	@Override
	public void run(ProcedureRunner runner) {
		CompositeMap context = runner.getContext();
		if (exp == null)
			exp = cdata;
		try {
			ScriptRunner sr = new ScriptRunner(exp, context, registry);
			sr.setImport(jsimport);
			sr.setProcedureRunner(runner);
			sr.setOptimizeLevel(optimizeLevel);
			Object res = sr.run();
			if (resultpath != null)
				context.putObject(resultpath, res, true);
		} catch (InterruptException ie) {
			ActionUtil.raiseApplicationError(runner, registry, ie.getMessage());
		} catch (ScriptException e) {
			StringBuilder sb = new StringBuilder(500);
			sb.append("ScriptException\n");
			sb.append("source:" + source + "\n");
			sb.append("line :" + (lineno + e.getLineNumber() - 1) + "\n");
			sb.append(e.getMessage() + "\n");
			throw new RuntimeException(sb.toString());
		} catch (Exception e1) {
			throw new RuntimeException(e1);
		}

	}

	@Override
	public void beginConfigure(CompositeMap config) {
		super.beginConfigure(config);
		lineno = config.getLocationNotNull().getStartLine();
		cdata = config.getText();
		if (cdata == null)
			cdata = "";
	}
}