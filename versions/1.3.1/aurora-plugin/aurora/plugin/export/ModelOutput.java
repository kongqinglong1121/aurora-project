package aurora.plugin.export;

import java.util.Iterator;
import java.util.logging.Level;

import javax.servlet.ServletException;
import aurora.application.config.BaseServiceConfig;
import aurora.presentation.component.std.config.DataSetConfig;
import aurora.service.ServiceContext;
import aurora.service.ServiceInstance;
import aurora.service.ServiceOutputConfig;
import uncertain.composite.CompositeMap;
import uncertain.event.EventModel;
import uncertain.logging.ILogger;
import uncertain.logging.LoggingContext;
import uncertain.ocm.IObjectRegistry;

public class ModelOutput {
	public final static String KEY_COLUMN_CONFIG = "_column_config_";
	public final String KEY_FILE_NAME = "_file_name_";
	public final String KEY_CHARSET = "GBK";
	public final String KEY_PROMPT = "prompt";
	public final String KEY_DATA_INDEX = "name";
	public final static String KEY_COLUMN = "column";
	public final String KEY_WIDTH = "width";
	public final String KEY_GENERATE_STATE = "_generate_state";
	public final String KEY_FORMAT = "_format";
	public final String KEY_EXCEL = "xls";

	IObjectRegistry mObjectRegistry;
	
	int modelQueryTagNum;

	public ModelOutput(IObjectRegistry registry) {
		mObjectRegistry = registry;
	}

	public int preInvokeService(ServiceContext context) throws Exception {
		CompositeMap parameters = context.getParameter();
		if (!parameters.getBoolean(KEY_GENERATE_STATE, false))
			return EventModel.HANDLE_NORMAL;
		ILogger mLogger = LoggingContext.getLogger("aurora.plugin.export",
				mObjectRegistry);
		ServiceInstance svc = ServiceInstance.getInstance(context
				.getObjectContext());

		// 修改fetchall为ture
		CompositeMap config = svc.getServiceConfigData().getChild(
				BaseServiceConfig.KEY_INIT_PROCEDURE);
		if (config == null) {
			mLogger.log(Level.SEVERE, "init-procedure tag must be defined");
			throw new ServletException("init-procedure tag must be defined");
		}

		String return_path = (String) svc.getServiceConfigData().getObject(
				ServiceOutputConfig.KEY_SERVICE_OUTPUT + "/@"
						+ ServiceOutputConfig.KEY_OUTPUT);
		if (return_path == null) {
			mLogger.log(Level.SEVERE, "service-output tag must be defined");
			throw new ServletException("service-output tag must be defined");
		} else {
			if (!return_path.startsWith("/"))
				return_path = "/" + return_path;
		}
		modelQueryTagNum=0;
		createConsumerTag(config, return_path, parameters);
		if(modelQueryTagNum==0){
			mLogger.log(Level.SEVERE, "The path '"+return_path+"' can't find model-query tag");
			throw new ServletException("The path '"+return_path+"' can't find model-query tag");
		}
		return EventModel.HANDLE_NORMAL;
	}

	boolean createConsumerTag(CompositeMap actionConfig, String return_path,
			CompositeMap parameters) {
		if(modelQueryTagNum!=0)return true;
		Iterator iterator = actionConfig.getChildIterator();
		if (iterator != null) {
			while (iterator.hasNext()) {
				if (createConsumerTag((CompositeMap) iterator.next(),
						return_path, parameters)) {					
					break;
				}
			}
		} else {
			String rootpath = actionConfig.getString("rootpath");
			if (rootpath != null) {
				if (!rootpath.startsWith("/"))
					rootpath = "/model/" + rootpath;
				if ("model-query".equals(actionConfig.getName())
						&& return_path.equalsIgnoreCase(rootpath)) {
					actionConfig.putBoolean(DataSetConfig.PROPERTITY_FETCHALL,
							true);
					if (KEY_EXCEL.equals(parameters.getString(KEY_FORMAT))) {
						actionConfig
								.createChildByTag("consumer")
								.createChildByTag("output-excel")
								.setNameSpaceURI(
										"http://www.aurora-framework.org/application");
						modelQueryTagNum++;
						return true;
					}
				}
			}
		}
		return false;
	}

	public int preCreateSuccessResponse(ServiceContext context)
			throws Exception {
		CompositeMap parameter = context.getParameter();
		if (!parameter.getBoolean(KEY_GENERATE_STATE, false))
			return EventModel.HANDLE_NORMAL;

		return EventModel.HANDLE_STOP;
	}
}